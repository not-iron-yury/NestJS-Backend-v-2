import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EmailResendDto } from './dto/verification-email-resend.dto';
// import { PhoneConfirmDto } from './dto/verification-phone-confirm.dto';
// import { PhoneResendDto } from './dto/verification-phone-resend.dto';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // Запрос на перевыпуск email-ссылки с tokens
  @Post('email-resend')
  async emailResend(@Body() dto: EmailResendDto) {
    return await this.verificationService.emailResendVerificationCode(dto.email);
  }

  // Маршрут для передачи токена на сервер
  @Get('email-confirm')
  async emailConfirm(
    @Query('aid') aid: string, // идентификатор аккаунта (или authAccountId)
    @Query('code') code: string, // токен верификации (в БД хэш)
    @Query('sig') sig: string, // криптографическая подпись (подтверждает, что aid и code не были подделаны клиентом)
  ) {
    return await this.verificationService.emailConfirm(aid, code, sig);
  }

  // // Маршрут для передачи sms-кода на сервер
  // @Post('phone-confirm')
  // async phoneConfirm(@Body() dto: PhoneConfirmDto, @Req() req: Request) {
  //   const meta = { ip: req.ip, deviceInfo: req.headers['user-agent'] };
  //   return await this.verificationService.phoneConfirm(dto, );
  // }

  // // Запрос перевыпуск sms-кода для верификации
  // @Post('phone-resend')
  // async phoneResend(@Body() dto: PhoneResendDto, @Req() req: Request) {
  //   const meta = { ip: req.ip, deviceInfo: req.headers['user-agent'] };
  //   return await this.verificationService.phoneResend(dto, meta);
  // }
}
