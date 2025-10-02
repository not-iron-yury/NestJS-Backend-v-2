export type CreateUserWithEmailInput = {
  email: string;
  password: string; // храним хэш в AuthAccount.password
  name?: string | null;
};

export type CreateUserWithPhoneInput = {
  phone: string;
  password?: string | null; // для случаев, когда по телефону есть пароль
  name?: string | null;
};
