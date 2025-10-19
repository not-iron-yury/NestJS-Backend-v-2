import { ConflictException, Injectable } from '@nestjs/common';
import { ClientType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/common/services/prisma.service';
import { ResponseUserDto } from 'src/modules/auth/dto/response-user.dto';
import {
  CreateUserWithEmailInput,
  CreateUserWithPhoneInput,
} from 'src/modules/auth/types/create-user-input.type';
import { UserRepository } from 'src/modules/users/users.repository';
import { VerificationService } from 'src/modules/verification/verification.service';
import { hashPassword } from 'src/utils/password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly verificationService: VerificationService,
  ) {}

  // Создаёт User + AuthAccount(provider=email) в транзакции.
  async createUserWithEmail(
    input: CreateUserWithEmailInput,
    clientType: ClientType,
  ): Promise<ResponseUserDto> {
    const { email, password, name } = input;
    const passwordHash = await hashPassword(password);

    try {
      return await this.prisma.$transaction(async (tx: PrismaService) => {
        // 1. Пробуем найти найти существующий AuthAccount
        const existingAuthAcc = await this.userRepository.findAuthAccount('EMAIL', email, tx);
        if (existingAuthAcc) throw new ConflictException('Такой пользователь уже существует');

        // 2. Запись пользователя в БД
        const user = await this.userRepository.createUser(email, name);
        // 3. Запись authAccount в БД
        const authAccount = await this.userRepository.createAuthAccount(
          {
            provider: 'EMAIL',
            providerId: email,
            passwordHash,
            passwordAlgo: process.env.PASSWORD_ALGO ?? null,
            userId: user.id,
          },
          tx,
        );

        // 4. Генерация и отправка email-link-token на email пользователя (для верификации)
        await this.verificationService.emailSendVerificationCode(authAccount.id, email, tx);

        // 5. Возвращаем данные пользователя
        return user;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  // Создаёт User + AuthAccount(provider=sms) в транзакции.
  async createUserWithPhone(
    input: CreateUserWithPhoneInput,
    clientType: ClientType,
  ): Promise<ResponseUserDto> {
    const { phone, password, name } = input;
    const passwordHash = password ? await hashPassword(password) : null;

    try {
      return await this.prisma.$transaction(async (tx: PrismaService) => {
        // 1. Пробуем найти найти существующий AuthAccount
        const existingAuthAcc = await this.userRepository.findAuthAccount('SMS', phone, tx);
        if (existingAuthAcc) throw new ConflictException('Такой пользователь уже существует');

        // 2. Записываем пользователя в БД
        const user = await this.userRepository.createUser(phone, name);

        // 3. Записываем authAccount пользователя в БД
        await this.userRepository.createAuthAccount(
          {
            provider: 'SMS',
            providerId: phone,
            passwordHash,
            passwordAlgo: process.env.PASSWORD_ALGO ?? null,
            userId: user.id,
          },
          tx,
        );

        // 4. Возвращаем данные пользователя
        return user;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
