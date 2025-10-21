import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { EmailResendDto } from './dto/verification-email-resend.dto';
import { PhoneConfirmDto } from './dto/verification-phone-confirm.dto';
import { PhoneResendDto } from './dto/verification-phone-resend.dto';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // Запрос на перевыпуск email-verification-link
  @Post('email-resend')
  async emailResend(@Body() dto: EmailResendDto) {
    return await this.verificationService.resendVerificationCode(AuthProvider.EMAIL, dto.email);
  }
  // Запрос на перевыпуск sms-verification-code
  @Post('phone-resend')
  async phoneResend(@Body() dto: PhoneResendDto) {
    return await this.verificationService.resendVerificationCode(AuthProvider.SMS, dto.phone);
  }

  // Маршрут для подтверждения email
  @Get('email-confirm')
  async emailConfirm(
    @Query('aid') aid: string, // идентификатор аккаунта (или authAccountId)
    @Query('code') code: string, // токен верификации (в БД хэш)
    @Query('sig') sig: string, // криптографическая подпись (подтверждает, что aid и code не были подделаны клиентом)
  ) {
    return await this.verificationService.confirmEmail(aid, code, sig);
  }

  // Маршрут для передачи sms-кода на сервер
  @Post('phone-confirm')
  async phoneConfirm(@Body() dto: PhoneConfirmDto) {
    return await this.verificationService.confirmPhone(dto.phone, dto.code);
  }
}
