import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty({ message: 'Email field cannot be empty' })
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(6, 20, { message: 'must contain between 6 and 20 characters' })
  password: string;
}
