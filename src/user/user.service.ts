import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
const jwt = require('jsonwebtoken');

// import { JWT_SECRET } from '@app/lib/config';

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

    const newUser = new Object();
    Object.assign(newUser, createUserDto);

    const activationToken = createActivationToken(newUser);

    const url = `${process.env.CLIENT_URL}/user/activate/${activationToken}`;

    const txt = 'Verify your email address';

    sendEmail(this.configService, email, url, txt);

    return { msg: 'Register Success! Please activate your account.' };

    // return await this.userRepository.save(newUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
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

    const isPasswordCorrect = await bcrypt.compare(
      loginUserDto.password,
      user.password
    );

    if (!isPasswordCorrect) {
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return user;
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
}

const createActivationToken = (payload: Object): string => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: '5m'
  });
};

const createAccessToken = (payload: Object): string => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m'
  });
};

const createRefreshToken = (payload: Object): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d'
  });
};
