import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { createHmac } from 'crypto';
import { PinoLogger } from 'pino-nestjs';
import { PrismaService } from 'src/common/services/prisma.service';
import { UserRepository } from 'src/modules/users/users.repository';
import {
  compareCode,
  generateEmailVerificationCode,
  generateSmsVerificationCode,
  hashCode,
} from 'src/utils/crypto';
import { emailExpiresAt, smsExpiresAt } from 'src/utils/expires-at';
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
   * Генерация email-verification-link и отправка письма
   */
  async emailSendVerificationCode(
    authAccountId: string,
    email: string,
    tx: PrismaService = this.prisma,
  ): Promise<void> {
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
   * Генерация sms-verification-code и отправка сообщения
   */
  async phoneSendVerificationCode(
    authAccountId: string,
    phone: string,
    tx: PrismaService = this.prisma,
  ): Promise<void> {
    // 1. Создание sms-кода верификации
    const code = generateSmsVerificationCode();

    // 2. Создание кода верификации для authAccountId и вычисление срока годности
    const codeHash = hashCode(code);
    const expiresAt = smsExpiresAt();

    // 3. Запись в БД
    await this.verificationRepository.createOrUpdateCode(authAccountId, codeHash, expiresAt, tx);

    // 4. Отправка письма с ссылкой (симуляция)
    this.logger.info(`Send SMS to number ${phone}`);
    this.logger.info(`SMS >> ${code}`);
  }

  /**
   * Перевыпуск кода верификации и отправка клиенту
   */
  async resendVerificationCode(
    provider: AuthProvider,
    providerId: string,
    tx: PrismaService = this.prisma,
  ): Promise<{ message: string }> {
    // 1. Проверяем наличие уже существующей записи в БД
    const authAccount = await this.userRepository.findAuthAccount(provider, providerId);
    if (!authAccount) throw new BadRequestException('Несуществующий аккаунт');

    // 2. Проверяем authAccount, если уже подтвержден возвращаем соответствующее сообщение
    if (authAccount.isVerified) return { message: 'Аккаунт уже подтвержден' };

    // 3. Генерируем код верификации (link/sms) и передаем клиенту
    if (provider === AuthProvider.EMAIL) {
      await this.emailSendVerificationCode(authAccount.id, providerId, tx);
    } else if (provider === AuthProvider.SMS) {
      await this.phoneSendVerificationCode(authAccount.id, providerId, tx);
    } else {
      throw new BadRequestException('Неизвестный тип провайдера');
    }

    return { message: 'Данные для верификации отправлены' };
  }
  /**
   * Проверка токена верификации и подтверждение authAccount в случае успеха
   */
  async confirmEmail(
    aid: string,
    code: string,
    sig: string,
  ): Promise<{ message: string; isVerified: boolean }> {
    // 1. Пробуем получить данные по верификации и связанному authAccount
    const verificationTokenWithAuthAcc = await this.verificationRepository.findByAuthAccountId(aid);
    if (!verificationTokenWithAuthAcc || !verificationTokenWithAuthAcc.code)
      throw new BadRequestException('Неправильный email токен');

    const { authAccount, ...verificationToken } = verificationTokenWithAuthAcc;

    // 2. Проверка просрочки кода верификации
    if (verificationToken.usedAt) throw new BadRequestException('Токен верификации был отозван');
    if (verificationToken.expiresAt < new Date())
      throw new BadRequestException('Просроченный токен верификации');

    // 3. Сравнение токенов
    const isIdentical = compareCode(verificationToken.code, code);
    if (!isIdentical) throw new UnauthorizedException('Неправильный токен верификации');

    // 4. Сравнение криптографических сигнатур
    const SECRET = this.configService.get<string>('VERIFICATION_SECRET') || this.secret;
    const validSig = createHmac('sha256', SECRET)
      .update(`${authAccount.providerId}:${code}`)
      .digest('base64url');
    if (sig !== validSig)
      throw new UnauthorizedException('Неправильная сигнатура в ссылке верификации');

    // 5. Отмечаем код верификации как использованный и подтверждаем AuthAccount пользователя
    await this.prisma.$transaction(async (tx: PrismaService) => {
      await this.verificationRepository.markUsed(aid, tx);
      await this.userRepository.confirmAuthAccount(AuthProvider.EMAIL, authAccount.providerId, tx);
    });
    return { message: 'Аккаунт подтвержден', isVerified: true };
  }

  /**
   * Проверка sms кода верификации и подтверждение authAccount в случае успеха
   */
  async confirmPhone(
    phone: string,
    code: string,
  ): Promise<{ message: string; isVerified: boolean }> {
    // 1. Пробуем получить данные по верификации и связанному authAccount
    const hash = hashCode(code);
    const verificationTokenWithAuthAcc = await this.verificationRepository.findByCode(hash);

    if (!verificationTokenWithAuthAcc || !verificationTokenWithAuthAcc.code)
      throw new BadRequestException('Неправильный sms код');

    const { authAccount, ...verificationToken } = verificationTokenWithAuthAcc;

    // 2. Проверка просрочки кода верификации
    if (verificationToken.usedAt || verificationToken.expiresAt < new Date())
      throw new BadRequestException('Код верификации устарел');

    // 3. Сравнение токенов
    const isIdenticalCode = compareCode(verificationToken.code, code);
    if (!isIdenticalCode) throw new UnauthorizedException('Неправильный код верификации');

    // 4. Сравнение номеров телефона
    const isIdenticalPhone = phone === authAccount.providerId;
    if (!isIdenticalPhone) throw new UnauthorizedException('Не совпадает номер телефона');

    // 5. Отмечаем код верификации как использованный и подтверждаем AuthAccount пользователя
    await this.prisma.$transaction(async (tx: PrismaService) => {
      await this.verificationRepository.markUsed(verificationToken.authAccountId, tx);
      await this.userRepository.confirmAuthAccount(AuthProvider.SMS, authAccount.providerId, tx);
    });
    return { message: 'Аккаунт подтвержден', isVerified: true };
  }
}
