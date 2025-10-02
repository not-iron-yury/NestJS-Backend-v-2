import { Injectable } from '@nestjs/common';
import { AuthAccount, AuthProvider, User } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma.service';
import { getIdentityField } from 'src/utils/identity-field';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Поиск пользователя по ID
  async findById(id: string, tx = this.prisma): Promise<User | null> {
    return await tx.user.findUnique({ where: { id } });
  }

  // Поиск пользователя по email через authAccount
  async findByEmail(email: string, tx = this.prisma): Promise<User | null> {
    return await tx.authAccount
      .findUnique({
        where: { provider_providerId: { provider: 'EMAIL', providerId: email } },
        include: { user: true },
      })
      .then((data) => data?.user ?? null);
  }

  // Поиск пользователя по номеру телефона через authAccount
  async findByPhone(phone: string, tx = this.prisma): Promise<User | null> {
    return await tx.authAccount
      .findUnique({
        where: { provider_providerId: { provider: 'SMS', providerId: phone } },
        include: { user: true },
      })
      .then((data) => data?.user ?? null);
  }

  // Поиск пользователя по аккаунту
  async findByAuthAccount(
    provider: AuthProvider,
    providerId: string,
    tx = this.prisma,
  ): Promise<User | null> {
    return await tx.authAccount
      .findUnique({
        where: { provider_providerId: { provider, providerId } },
        include: { user: true },
      })
      .then((data) => data?.user ?? null);
  }

  // Поиск AuthAccount пользователя
  async findAuthAccount(
    provider: AuthProvider,
    providerId: string,
    tx = this.prisma,
  ): Promise<AuthAccount | null> {
    return await tx.authAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
  }

  // Создание пользователя по email или phone
  async createUser(identifier: string, name: string | null = null, tx = this.prisma) {
    const field = getIdentityField(identifier);
    return await tx.user.create({
      data: { name, [field]: identifier },
    });
  }

  // Создание AuthAccount пользователя
  async createAuthAccount(params: {
    provider: AuthProvider;
    providerId: string;
    passwordHash: string | null;
    userId: string;
    tx: PrismaService;
  }) {
    const { provider, providerId, passwordHash, userId, tx = this.prisma } = params;
    await tx.authAccount.create({
      data: {
        provider,
        providerId,
        passwordHash: passwordHash ?? null,
        userId,
      },
    });
  }
}
