import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/common/services/prisma.service';
import { ResponseUserDto } from 'src/modules/auth/dto/response-user.dto';
import {
  CreateUserWithEmailInput,
  CreateUserWithPhoneInput,
} from 'src/modules/auth/types/create-user-input.type';
import { UserRepository } from 'src/modules/users/users.repository';
import { hashPassword } from 'src/utils/password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {}

  // Создаёт User + AuthAccount(provider=email) в транзакции.
  async createUserWithEmail(input: CreateUserWithEmailInput): Promise<ResponseUserDto> {
    const { email, password, name } = input;
    const passwordHash = await hashPassword(password);

    try {
      return await this.prisma.$transaction(async (tx: PrismaService) => {
        // 1. Пробуем найти найти существующий AuthAccount
        const existingAuthAcc = await this.userRepository.findAuthAccount('EMAIL', email, tx);
        if (existingAuthAcc) throw new ConflictException('Такой пользователь уже существует');

        // 2. Записываем пользователя в БД
        const user = await this.userRepository.createUser(email, name);

        // 3. Записываем authAccount пользователя в БД
        await this.userRepository.createAuthAccount({
          provider: 'EMAIL',
          providerId: email,
          passwordHash,
          userId: user.id,
          tx,
        });

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

  // Создаёт User + AuthAccount(provider=sms) в транзакции.
  async createUserWithPhone(input: CreateUserWithPhoneInput): Promise<ResponseUserDto> {
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
        await this.userRepository.createAuthAccount({
          provider: 'SMS',
          providerId: phone,
          passwordHash,
          userId: user.id,
          tx,
        });

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
