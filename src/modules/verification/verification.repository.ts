import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';

@Injectable()
export class VerificationRepository {
  constructor(private prisma: PrismaService) {}

  // Создаёт новый (или обновляет существующий) код верификации для authAccountId.
  // У одного аккаунта всегда только один активный код.
  async createOrUpdateCode(
    authAccountId: string,
    codeHash: string,
    expiresAt: Date,
    tx: PrismaService = this.prisma,
  ) {
    return await tx.verificationCode.upsert({
      where: { authAccountId },
      update: {
        code: codeHash,
        expiresAt,
      },
      create: {
        authAccountId,
        code: codeHash,
        expiresAt,
      },
    });
  }

  // Возвращает актуальную запись о верификации для конкретного authAccountId.
  async findByAuthAccount(authAccountId: string, tx: PrismaService = this.prisma) {
    return await tx.verificationCode.findUnique({
      where: { authAccountId },
    });
  }

  // Помечает код как использованный, записывая текущую дату в usedAt.
  async markUsed(authAccountId: string, tx: PrismaService = this.prisma) {
    await tx.verificationCode.update({
      where: { authAccountId },
      data: { usedAt: new Date() },
    });
  }

  // Удаляет старый код при повторной генерации нового кода.
  async invalidate(authAccountId: string, tx: PrismaService = this.prisma) {
    await tx.verificationCode.delete({
      where: { authAccountId },
    });
  }
}
