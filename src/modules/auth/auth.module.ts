import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { UsersModule } from 'src/modules/users/users.module';
import { UserRepository } from 'src/modules/users/users.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VerificationModule } from 'src/modules/verification/verification.module';
import { VerificationService } from 'src/modules/verification/verification.service';

@Module({
  imports: [UsersModule, VerificationModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PrismaService, VerificationService],
})
export class AuthModule {}
