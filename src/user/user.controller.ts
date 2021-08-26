import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { UserService } from '@app/user/user.service';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body('user') createUserDto: CreateUserDto): Promise<any> {
    const result = await this.userService.register(createUserDto);
    return result;
    // const user = await this.userService.register(createUserDto);
    // return this.userService.buildUserResponse(user);
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
}
