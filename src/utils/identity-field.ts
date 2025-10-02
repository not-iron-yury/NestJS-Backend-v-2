export enum fields {
  EMAIL = 'email',
  PHONE = 'phone',
}

type fieldType = 'email' | 'phone';

export function getIdentityField(identifier: string): fieldType {
  return identifier.includes('@') ? fields.EMAIL : fields.PHONE;
}
