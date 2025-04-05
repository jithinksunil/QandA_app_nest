import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class SigninDTO {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    description: 'Strong password',
    example: 'Abcd1234!',
  })
  password: string;
}

export class SignupDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    description: 'Strong password',
    example: 'Abcd1234!',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty({
    description: 'Strong password',
    example: 'Abcd1234!',
  })
  confirmPassword: string;
}
