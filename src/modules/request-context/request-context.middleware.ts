import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly ctxService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const requestId = (req as any).id || req.headers['x-request-id'] || 'unknown';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.ctxService.run({ requestId }, () => next());
  }
}
