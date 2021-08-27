import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import { Response } from 'express';

import { UserEntity } from '@app/user/user.entity';
import { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { UserType } from './types/user.type';
import { LoginUserDto } from './dto/loginUser.dto';
import { sendEmail } from './sendMail';

@Injectable()
export class UserService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async register(createUserDto: CreateUserDto): Promise<any> {
    const errorResponse = {
      errors: {}
    };

    const { username, email, password } = createUserDto;

    const userByEmail = await this.userRepository.findOne({
      email
    });

    const userByUsername = await this.userRepository.findOne({
      username
    });

    if (userByEmail) {
      errorResponse.errors['email'] = 'has already been registered';
    }

    if (userByUsername) {
      errorResponse.errors['username'] = 'has already been taken';
    }

    if (userByEmail || userByUsername) {
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const newUser = new CreateUserDto();
    Object.assign(newUser, createUserDto);

    const passwordHash = await bcrypt.hash(password, 12);

    newUser.password = passwordHash;

    const activationToken = createActivationToken(newUser);

    const url = `${process.env.CLIENT_URL}/user/activate/${activationToken}`;

    const txt = 'Verify your email address';

    sendEmail(this.configService, email, url, txt);

    return { msg: 'Register Success! Please activate your account.' };
  }

  async activateEmail(activationToken: string) {
    try {
      const activationTokenSecret = this.configService.get(
        'activationTokenSecret'
      );
      const user = jwt.verify(activationToken, activationTokenSecret);

      const { username, email, password } = user;

      const check = await this.userRepository.findOne({
        email
      });

      if (check) {
        throw new HttpException(
          'This email has already been registered',
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      const newUser = new CreateUserDto();
      newUser.username = username;
      newUser.email = email;
      newUser.password = password;

      return await this.userRepository.save(newUser);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginUserDto: LoginUserDto, response: Response): Promise<any> {
    const errorResponse = {
      errors: {
        'email or password': 'is invalid'
      }
    };

    const user = await this.userRepository.findOne(
      {
        email: loginUserDto.email
      },
      { select: ['id', 'username', 'email', 'password'] }
    );

    if (!user) {
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const isMatch = await bcrypt.compare(loginUserDto.password, user.password);

    if (!isMatch) {
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const refreshToken = createRefreshToken({ id: user.id });

    response.cookie('refreshtoken', refreshToken, {
      httpOnly: true,
      path: '/user/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return response.json({ msg: 'Login success' });
  }

  async getAccessToken(cookies: any, response: Response): Promise<any> {
    try {
      const refreshToken = cookies.refreshtoken;

      if (!refreshToken) {
        throw new HttpException('Please login', HttpStatus.BAD_REQUEST);
      }

      jwt.verify(
        refreshToken,
        this.configService.get('refreshTokenSecret'),
        (err, user) => {
          if (err) {
            return response.status(400).json({
              msg: 'Please login'
            });
          }
          const accessToken = createAccessToken({ id: user.id });
          return response.json({ accessToken });
        }
      );
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async forgotPassword(email: string, response: Response): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ email });
      if (!user) {
        return response
          .status(400)
          .json({ msg: 'This email is not registered' });
      }

      const accessToken = createAccessToken({ id: user.id });
      const url = `${this.configService.get(
        'clientUrl'
      )}/user/reset-password/${accessToken}`;
      const txt = 'Reset your password';

      sendEmail(this.configService, email, url, txt);

      response.json({ msg: 'Please check your email to reset the password' });
    } catch (err) {
      if (err) {
        return response.status(500).json({ msg: err.message });
      }
    }
  }

  async resetPassword(
    userId: number,
    password: string,
    response: Response
  ): Promise<any> {
    try {
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await this.findById(userId);
      user.password = passwordHash;

      this.userRepository.save(user);

      response.json({ msg: 'Password was reset successfully' });
    } catch (err) {
      return response.status(500).json({ msg: err.message });
    }
  }

  getAllUsersInfo() {
    throw new Error('Method not implemented.');
  }

  async logout(response: Response) {
    try {
      response.clearCookie('refreshtoken', { path: '/user/refresh-token' });
      return response.json({ msg: 'Logged out' });
    } catch (err) {
      return response.status(500).json({ msg: err.message });
    }
  }

  generateJwt(user: UserType): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      this.configService.get('jwtSecret')
    );
  }

  buildUserResponse(user: UserType): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user)
      }
    };
  }

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne(id);
  }
}

const createActivationToken = (payload: CreateUserDto): string => {
  return jwt.sign(
    JSON.parse(JSON.stringify(payload)),
    process.env.ACTIVATION_TOKEN_SECRET,
    {
      expiresIn: '5m'
    }
  );
};

const createAccessToken = (payload: { id: number }): string => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m'
  });
};

const createRefreshToken = (payload: { id: number }): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d'
  });
};
