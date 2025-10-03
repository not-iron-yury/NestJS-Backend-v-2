import { Injectable } from '@nestjs/common';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  constructor(private readonly verificationRepository: VerificationRepository) {}
}
