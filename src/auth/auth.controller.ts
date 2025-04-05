import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDTO, SignupDTO } from './dto/auth.dto';
import { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { refreshEndpoint, ROUTE_PREFIXES } from 'src/common';
import { JwtAuthGuard } from 'src/guards/jwtAuth.guard';
import { Public } from 'src/guards/public.guard';
import { Roles, User } from 'src/decorators';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/guards';
@ApiTags('Auth')
@Controller(ROUTE_PREFIXES.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up',
    description: 'End point for Sign up the user',
  })
  @ApiBody({ type: SignupDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Return and json object of userId and a message',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  signup(@Body() body: SignupDTO) {
    return this.authService.signup({
      email: body.email,
      name: body.name,
      password: body.password,
      confirmPassword: body.confirmPassword,
    });
  }

  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description: 'End point for Sign in the user',
  })
  @ApiBody({ type: SigninDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Return and json object and the refresh token is set as an http only cookie',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  signin(@Body() body: SigninDTO, @Res({ passthrough: true }) res: Response) {
    return this.authService.signin(body, res);
  }

  @Get(refreshEndpoint)
  @ApiOperation({
    summary: 'Token refresh end point',
    description:
      'End point to refresh the tokens with the refresh token attached in the cookies',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Return and json object and the refresh token is set as an http only cookie',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Sign out',
    description:
      'End point to sign out the user and remove the refresh token from the cookies',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Return and json object of a message',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  signout(@User('id') id: string, @Res({ passthrough: true }) res: Response) {
    return this.authService.signout(id, res);
  }
}
