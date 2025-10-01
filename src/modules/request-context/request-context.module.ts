import { Module } from '@nestjs/common';

import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from './request-context.service';

@Module({
  providers: [RequestContextService, RequestContextMiddleware],
  exports: [RequestContextService],
})
export class RequestContextModule {}
