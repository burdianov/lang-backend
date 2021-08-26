import { Body, Controller, Get, Post } from '@nestjs/common';

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

  @Post('login')
  async login(
    @Body('user') loginUserDto: LoginUserDto
  ): Promise<UserResponseInterface> {
    const user = await this.userService.login(loginUserDto);
    return this.userService.buildUserResponse(user);
  }
}
