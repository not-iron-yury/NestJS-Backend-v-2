import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { UsersModule } from 'src/modules/users/users.module';
import { UserRepository } from 'src/modules/users/users.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PrismaService],
})
export class AuthModule {}
