import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { createHmac } from 'crypto';
import { PinoLogger } from 'pino-nestjs';
import { PrismaService } from 'src/common/services/prisma.service';
import { UserRepository } from 'src/modules/users/users.repository';
import { compareCode, generateEmailVerificationCode, hashCode } from 'src/utils/crypto';
import { emailExpiresAt } from 'src/utils/expires-at';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  private readonly secret = 'kek-secret';

  constructor(
    private readonly verificationRepository: VerificationRepository,
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Генерация email-ссылки и отправка письма
   */
  async emailSendVerificationCode(
    authAccountId: string,
    email: string,
    tx: PrismaService = this.prisma,
  ) {
    const SECRET = this.configService.get<string>('VERIFICATION_SECRET') || this.secret;
    const APP_URL = this.configService.get<string>('APP_URL') as string;

    // 1. Генерация ссылки
    const code = generateEmailVerificationCode();
    const sault = `${email}:${code}`;
    const signature = createHmac('sha256', SECRET).update(sault).digest('base64url');
    const emailLink = `${APP_URL}/verification/email-confirm?aid=${authAccountId}&code=${code}&sig=${signature}`;

    // 2. Создание кода верификации для authAccountId (aid)
    const codeHash = hashCode(code);
    const expiresAt = emailExpiresAt();

    // 3. Запись в БД
    await this.verificationRepository.createOrUpdateCode(authAccountId, codeHash, expiresAt, tx);

    // 4. Отправка письма с ссылкой (симуляция)
    this.logger.info('Send email with link');
    this.logger.info(`Link >> ${emailLink}`);
  }

  /**
   * Перевыпуск email-ссылки и повторная отправка письма
   */
  async emailResendVerificationCode(email: string, tx: PrismaService = this.prisma) {
    // 1. Проверяем наличие уже существующей записи в БД
    const authAccount = await this.userRepository.findAuthAccount(AuthProvider.EMAIL, email);
    if (!authAccount) throw new BadRequestException('Несуществующий email');

    // 2. Проверяем authAccount, если уже подтвержден возвращаем соответствующее сообщение
    if (authAccount.isVerified) return { message: 'Email уже подтвержден' };

    // 3. Генерируем ссылку верификации и отправляем письмо
    await this.emailSendVerificationCode(authAccount.id, email, tx);

    return { message: 'Ссылка отправлена на почту' };
  }

  /**
   * Проверка email-link-token (подтверждение aid в случае успеха)
   */
  async emailConfirm(aid: string, code: string, sig: string) {
    const SECRET = this.configService.get<string>('VERIFICATION_SECRET') || this.secret;

    // 1. Пробуем получить данные по верификации и связанному authAccount
    const verificationTokenWithAuthAcc = await this.verificationRepository.findByAuthAccount(aid);
    if (!verificationTokenWithAuthAcc || !verificationTokenWithAuthAcc.code)
      throw new BadRequestException('Несуществующий email токен');

    const { authAccount, ...verificationToken } = verificationTokenWithAuthAcc;

    // 2. Проверка просрочки кода верификации
    if (verificationToken.usedAt) throw new BadRequestException('Токен верификации был отозван');
    if (verificationToken.expiresAt < new Date())
      throw new BadRequestException('Просроченный email токен');

    // 3. Сравнение токенов
    const isIdentical = compareCode(verificationToken.code, code);
    if (!isIdentical) throw new UnauthorizedException('Не правильный код верификации');

    // 4. Сравнение криптографических сигнатур
    const validSig = createHmac('sha256', SECRET)
      .update(`${authAccount.providerId}:${code}`)
      .digest('base64url');
    if (sig !== validSig)
      throw new UnauthorizedException('Не правильная сигнатура в ссылке верификации');

    // 5. Отмечаем код верификации как использованный и подтверждаем AuthAccount пользователя
    await this.prisma.$transaction(async (tx: PrismaService) => {
      await this.verificationRepository.markUsed(aid, tx);
      await this.userRepository.confirmAuthAccount(AuthProvider.EMAIL, authAccount.providerId, tx);
    });
    return { message: 'Email подтвержден' };
  }

  // // Выпуск sms-кода для верификации
  // async phoneSendVerificationCode(input: string, meta?: ClientMeta) {}

  // // Проверка sms-кода и подтверждение
  // async phoneConfirm(input: string, meta?: ClientMeta) {}
}
