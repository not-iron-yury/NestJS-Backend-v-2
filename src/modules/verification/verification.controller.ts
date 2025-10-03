import { Controller } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // POST /verification/email/resend - запрос на перевыпуск email-верификации
  // GET /verification/email/confirm?token=... - маршрут для передачи токена
  // POST /verification/phone/resend - запрос на перевыпуск sms-верификации
  // POST /verification/phone/confirm - - маршрут для передачи sms-кода
}
