import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDTO {
  @IsEnum(UserRole)
  @IsOptional()
  @ApiProperty({
    description: 'Role of the use',
    example: UserRole.VIEWER,
    type: 'string',
    enum: Object.values(UserRole),
    enumName: 'UserRole',
  })
  role: UserRole;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'To block the user send true to unblock send false',
    example: true,
    type: 'boolean',
  })
  blocked: boolean;
}

export class RenameUserDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'New name of the user',
    example: 'John Doe',
    type: 'string',
  })
  name: string;
}
