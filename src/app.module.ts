/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as Joi from 'joi';
import { LoggerModule } from 'pino-nestjs';
import { PrismaService } from 'src/common/services/prisma.service';
import { RequestContextMiddleware } from 'src/modules/request-context/request-context.middleware';
import { RequestContextModule } from 'src/modules/request-context/request-context.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

const config = {
  isGlobal: true, // модуль будет доступен во всех модулях без импорта
  envFilePath: '.env', // путь к env
  validationSchema: Joi.object({
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().default(5433),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  }),
};

const isProd = process.env.NODE_ENV === 'production';
const logger = {
  pinoHttp: {
    level: isProd ? 'info' : 'debug',
    genReqId: (req, res) => {
      // если уже есть request-id (например, от Nginx/Cloudflare) — используем его
      const existingId = req.headers['x-request-id'] as string;
      if (existingId) return existingId;

      // иначе генерим новый
      const id = randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    transport: !isProd
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    serializers: {
      req(req) {
        return {
          id: req.id as string, // requestId
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          method: req.method,
          url: req.url as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          ...(isProd ? {} : { body: req.bod, query: req.query }),
        };
      },
    },
  },
};

@Module({
  imports: [
    ConfigModule.forRoot(config),
    LoggerModule.forRoot(logger),
    RequestContextModule,
    UsersModule,
    AuthModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
