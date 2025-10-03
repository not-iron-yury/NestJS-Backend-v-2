import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';

@Injectable()
export class VerificationRepository {
  constructor(private prisma: PrismaService) {}
}
