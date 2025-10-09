import { IsPhoneNumber, IsString } from 'class-validator';

export class RegisterPhoneDto {
  @IsPhoneNumber('RU')
  phone: string;

  @IsString()
  name?: string;
}
