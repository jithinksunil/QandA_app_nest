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
  role: UserRole;

  @IsBoolean()
  @IsOptional()
  blocked: boolean;
}

export class RenameUserDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
