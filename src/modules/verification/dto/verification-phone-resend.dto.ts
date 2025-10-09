import { IsPhoneNumber } from 'class-validator';

export class PhoneResendDto {
  @IsPhoneNumber('RU')
  phone: string;
}
