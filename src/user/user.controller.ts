import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { UserService } from '@app/user/user.service';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { User } from './decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { UserResponseInterface } from './types/userResponse.interface';
import { UserType } from './types/user.type';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body('user') createUserDto: CreateUserDto): Promise<any> {
    const result = await this.userService.register(createUserDto);
    return result;
  }

  @Post('activation')
  async activateEmail(
    @Body('activationToken') activationToken: string
  ): Promise<any> {
    const result = await this.userService.activateEmail(activationToken);
    return result;
  }

  @Post('login')
  async login(
    @Res({ passthrough: false }) response: Response,
    @Body('user') loginUserDto: LoginUserDto
  ): Promise<any> {
    return this.userService.login(loginUserDto, response);
  }

  @Post('refresh-token')
  async getAccessToken(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    return this.userService.getAccessToken(request.cookies, response);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
    @Res() response: Response
  ): Promise<any> {
    return this.userService.forgotPassword(email, response);
  }

  @Post('reset-password')
  async resetPassword(
    @User('id') userId: number,
    @Body('password') password: string,
    @Res() response: Response
  ): Promise<any> {
    return this.userService.resetPassword(userId, password, response);
  }

  @Get('info')
  async getUserInfo(@User() user: UserEntity): Promise<UserType> {
    return user;
  }
}
