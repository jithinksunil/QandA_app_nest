import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDTO, SignupDTO } from './dto/auth.dto';
import { Request, Response } from 'express';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @HttpCode(HttpStatus.OK)
  @Get('/signin')
  signin(@Body() body: SigninDTO, @Res() res: Response) {
    return this.authService.signin(body, res);
  }
  @HttpCode(HttpStatus.CREATED)
  @Post('/signup')
  signup(@Body() body: SignupDTO) {
    return this.authService.signup({
      email: body.email,
      name: body.name,
      password: body.password,
      confirmPassword: body.confirmPassword,
    });
  }
  // @Get('/signout')
  // signout() {
  //   return this.authService.signout();
  // }
  @Get('/refresh')
  refresh(@Req() req: Request, @Res() res: Response) {
    return this.authService.refresh(req, res);
  }
}
