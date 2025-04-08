import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/primsa.module';
import { DocumentModule } from './document/document.module';
import { GlobalHttpModule } from './global-http/global-http.module';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DocumentModule,
    GlobalHttpModule,
    UserModule,
    ConversationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
