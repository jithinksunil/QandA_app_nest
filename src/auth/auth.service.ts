import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SigninDTO, SignupDTO } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  refreshEndpoint,
  ROUTE_PREFIXES,
  serverPrefix,
  compareHashedText,
  hashText,
} from 'src/common';
import { UserJWTPayload } from 'src/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signin({ email, password }: SigninDTO, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        name: true,
        email: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const isPasswordValid = await compareHashedText(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');
    const { accessToken } = await this.createAccessToken({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    });

    const { refreshToken, expiresIn: refreshTokenExpiresIn } =
      await this.createRefreshToken({
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
      });
    const refreshTokenHash = await hashText(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, lastLogin: new Date() },
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: refreshTokenExpiresIn,
      path: `${serverPrefix}${ROUTE_PREFIXES.AUTH}${refreshEndpoint}`,
    });
    return {
      accessToken,
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
  }

  async signup({ email, name, password, confirmPassword }: SignupDTO) {
    if (password !== confirmPassword)
      throw new BadRequestException('Passwords do not match');
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) throw new ConflictException('Email already taken');
    const passwordHash = await hashText(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.VIEWER,
      },
      select: { id: true },
    });
    // We can write logic to send a welcome email here (if required)
    return { message: 'User created successfully', id: user.id };
  }

  async refresh({
    refreshToken,
    res,
  }: {
    refreshToken: string | undefined;
    res: Response;
  }) {
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token found');
    const payload = await this.verifyRefreshToken(refreshToken);
    if (!payload) throw new UnauthorizedException('Token expired signin again');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        role: true,
        refreshTokenHash: true,
        id: true,
        email: true,
        name: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== payload.role)
      throw new UnauthorizedException(
        'Your permissions has been changed, please sign in again',
      );
    if (!compareHashedText(refreshToken, user.refreshTokenHash))
      throw new UnauthorizedException('Invalid refresh token');

    const { accessToken } = await this.createAccessToken({
      email: payload.email,
      id: payload.id,
      name: payload.name,
      role: payload.role,
    });
    const { refreshToken: newRefreshToken, expiresIn } =
      await this.createRefreshToken({
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
      });

    const refreshTokenHash = await hashText(newRefreshToken);
    await this.prisma.user.update({
      where: { id: payload.id },
      data: { refreshTokenHash },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: expiresIn,
      path: `${serverPrefix}${ROUTE_PREFIXES.AUTH}${refreshEndpoint}`,
    });

    return {
      accessToken,
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
  }

  async signout({res,userId}:{userId: string, res: Response}) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    res.clearCookie('refreshToken', {
      path: `${serverPrefix}${ROUTE_PREFIXES.AUTH}${refreshEndpoint}`,
    });
  }

  async createAccessToken(payload: UserJWTPayload) {
    const expiresIn = 60 * 60 * 1000; //1hr
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: `${expiresIn}`,
    });
    return { accessToken, expiresIn };
  }

  async createRefreshToken(payload: UserJWTPayload) {
    const expiresIn = 60 * 60 * 30 * 1000;
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: `${expiresIn}`, //30 days,
    });
    return { refreshToken, expiresIn };
  }

  async verifyAccessToken(token: string): Promise<UserJWTPayload | undefined> {
    try {
      return await this.jwtService.verifyAsync<UserJWTPayload>(token, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      });
    } catch (error) {
      return undefined;
    }
  }

  async verifyRefreshToken(token: string): Promise<UserJWTPayload | undefined> {
    try {
      return await this.jwtService.verifyAsync<UserJWTPayload>(token, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      return undefined;
    }
  }
}
