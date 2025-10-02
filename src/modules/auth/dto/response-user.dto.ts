import { Exclude } from 'class-transformer';

export class ResponseUserDto {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;

  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;

  constructor(data: ResponseUserDto) {
    Object.assign(this, data);
  }
}
