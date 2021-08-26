import { IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({ message: 'Email field cannot be empty' })
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;
}
