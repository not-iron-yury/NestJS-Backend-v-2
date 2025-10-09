import { Body, Controller, Post } from '@nestjs/common';
import { ClientType } from '@prisma/client';
import { RegisterEmailDto } from 'src/modules/auth/dto/register-email.dto';
import { RegisterPhoneDto } from 'src/modules/auth/dto/register-phone.dto';
import { ResponseUserDto } from 'src/modules/auth/dto/response-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  async createUserWithEmail(@Body() dto: RegisterEmailDto) {
    const user = await this.authService.createUserWithEmail(dto, ClientType.WEB);
    return new ResponseUserDto(user);
  }

  @Post('register/phone')
  async createUserWithPhone(@Body() dto: RegisterPhoneDto) {
    console.log('Controller');
    const user = await this.authService.createUserWithPhone(dto, ClientType.MOBILE);
    return new ResponseUserDto(user);
  }
}
