import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'pino-nestjs';
import { RequestContextService } from 'src/modules/request-context/request-context.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
    private readonly ctxService: RequestContextService,
  ) {}

  getAllUsers() {
    const requestId = this.ctxService.getRequestId();
    this.logger.info('Fetching all users...');
    this.logger.debug({ requestId }, 'This is a DEBUG log');
    this.logger.warn({ requestId }, 'This is a WARN log');
    this.logger.error({ requestId }, 'This is an ERROR log');
    return [];
  }
}
