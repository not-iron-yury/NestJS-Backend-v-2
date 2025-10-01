import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
}

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run(context: RequestContext, callback: () => void) {
    this.als.run(context, callback);
  }

  getRequestId(): string | undefined {
    const store = this.als.getStore();
    return store?.requestId;
  }
}
