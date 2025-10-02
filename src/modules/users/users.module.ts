import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { RequestContextModule } from 'src/modules/request-context/request-context.module';
import { UserRepository } from 'src/modules/users/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RequestContextModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, PrismaService],
  exports: [UserRepository],
})
export class UsersModule {}
