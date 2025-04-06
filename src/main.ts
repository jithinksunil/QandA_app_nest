import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './globalException.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { serverPrefix } from './common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix(serverPrefix);
  app.enableCors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  });
  const config = new DocumentBuilder()
  .setTitle('Rag-Q&A API')
  .setDescription('Api for users and document management')
  .setVersion('1.0')
  .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
