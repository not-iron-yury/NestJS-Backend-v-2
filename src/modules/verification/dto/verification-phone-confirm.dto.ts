import { IsPhoneNumber, IsString, Length, Matches } from 'class-validator';

export class PhoneConfirmDto {
  @IsPhoneNumber('RU')
  phone: string;

  @IsString({ message: 'Код должен быть строкой' })
  @Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
  @Matches(/^\d+$/, { message: 'Код должен состоять только из цифр' })
  code: string;
}
