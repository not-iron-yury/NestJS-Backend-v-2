import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'pino-nestjs';
import { PrismaService } from 'src/common/services/prisma.service';
import { UserRepository } from 'src/modules/users/users.repository';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from './verification.repository';
import { VerificationService } from './verification.service';

@Module({
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationRepository,
    UserRepository,
    PrismaService,
    ConfigService,
    PinoLogger,
  ],
  exports: [VerificationService, VerificationRepository],
})
export class VerificationModule {}
