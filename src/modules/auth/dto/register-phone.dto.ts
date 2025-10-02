import { ClientType } from '@prisma/client';
import { IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class RegisterPhoneDto {
  @IsPhoneNumber('RU')
  phone: string;

  @IsString()
  name?: string;

  @IsOptional()
  clientType?: ClientType = ClientType.MOBILE;
}
