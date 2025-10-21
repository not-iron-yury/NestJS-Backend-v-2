type ExpiresAtType = 'hours' | 'minutes';

function addTime(type: ExpiresAtType, value: number): Date {
  const expiresAt = new Date();
  if (type === 'hours') expiresAt.setHours(expiresAt.getHours() + value);
  else expiresAt.setHours(expiresAt.getMinutes() + value);
  return expiresAt;
}

export function emailExpiresAt() {
  const hours = Number(process.env.EMAIL_TOKEN_TTL_HOURS ?? 24);
  return addTime('hours', hours);
}

export function smsExpiresAt() {
  const minutes = Number(process.env.SMS_TOKEN_TTL_HOURS ?? 15);
  return addTime('minutes', minutes);
}
