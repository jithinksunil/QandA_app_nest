import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJWTPayload } from 'src/interfaces';

export const User = createParamDecorator(
  (data: keyof UserJWTPayload, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserJWTPayload;
    return user[data];
  },
);
