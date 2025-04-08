import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROUTE_PREFIXES, swaggerAccessTokenName } from 'src/common';
import { Roles, User } from 'src/decorators';
import { JwtAuthGuard, RolesGuard } from 'src/guards';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RenameUserDTO, UpdateUserDTO } from './dto/user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(ROUTE_PREFIXES.USER)
@ApiTags('User')
@ApiBearerAuth(swaggerAccessTokenName)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/view-users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List of all users',
    description: 'End point for the admin to see all the users',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return a json object',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string', enum: Object.values(UserRole) },
        blocked: { type: 'boolean' },
        documentCount: { type: 'number' },
      },
    },
  })
  viewUsers() {
    return this.userService.viewUsers();
  }

  @Patch('/:id/update-user')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user role',
    description: 'End point for the admin to update user role',
  })
  @ApiBody({ type: UpdateUserDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return a json object',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        id: { type: 'string' },
        role: { type: 'string', enum: Object.values(UserRole) },
        blocked: { type: 'boolean' },
      },
    },
  })
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDTO) {
    return this.userService.updateUser({
      id,
      role: body.role,
      blocked: body.blocked,
    });
  }

  @Patch('/rename-user')
  @ApiOperation({
    summary: 'Rename user',
    description: 'End point for all users to rename their name',
  })
  @ApiBody({ type: RenameUserDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return a json object',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  renameUser(@User('id') id: string, @Body() body: RenameUserDTO) {
    return this.userService.renameUser({
      id,
      name: body.name,
    });
  }
}
