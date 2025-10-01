import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'pino-nestjs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // --- ValidationPipe -
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // лишние поля отбрасываются
      forbidNonWhitelisted: true, // если пришло лишнее поле - выбрасывает ошибку
      transform: true, // авто-преобразование типов
    }),
  );

  // --- Swagger ---
  const cofigSwgr = new DocumentBuilder()
    .setTitle('NestJS backend pet-project')
    .setDescription('Документация проекта')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'accessToken') //  поддержка Bearer-аутентификации
    .build();

  const document = SwaggerModule.createDocument(app, cofigSwgr);
  SwaggerModule.setup('api-docs', app, document);

  // ---- configService ---
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  // ----------------
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
