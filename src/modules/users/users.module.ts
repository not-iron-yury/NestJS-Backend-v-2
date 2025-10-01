import { Module } from '@nestjs/common';
import { RequestContextModule } from 'src/modules/request-context/request-context.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RequestContextModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
