import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { EmailResendDto } from './dto/verification-email-resend.dto';
import { PhoneConfirmDto } from './dto/verification-phone-confirm.dto';
import { PhoneResendDto } from './dto/verification-phone-resend.dto';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // Маршрут для передачи токена на сервер
  @Get('email-confirm')
  async emailConfirm(@Query('code') code: string, @Req() req: Request) {
    const meta = { ip: req.ip, deviceInfo: req.headers['user-agent'] };
    return await this.verificationService.emailConfirm(code, meta);
  }

  // Маршрут для передачи sms-кода на сервер
  @Post('phone-confirm')
  async phoneConfirm(@Body() dto: PhoneConfirmDto, @Req() req: Request) {
    const meta = { ip: req.ip, deviceInfo: req.headers['user-agent'] };
    return await this.verificationService.phoneConfirm(dto, meta);
  }

  // Запрос на перевыпуск email-ссылки с tokens
  @Post('email-resend')
  async emailResend(@Body() dto: EmailResendDto, @Req() req: Request) {
    const meta = { ip: req.ip, deviceInfo: req.headers['user-agent'] };
    return await this.verificationService.emailResend(dto, meta);
  }

  // Запрос перевыпуск sms-кода для верификации
  @Post('phone-resend')
  async phoneResend(@Body() dto: PhoneResendDto, @Req() req: Request) {
    const meta = { ip: req.ip, deviceInfo: req.headers['user-agent'] };
    return await this.verificationService.phoneResend(dto, meta);
  }
}
