import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Генерация шестизначного числового кода
export function generateSmsVerificationCode(): string {
  const num = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return num.toString().padStart(6, '0');
}

// Генерация кода для ссылки в email
export function generateEmailVerificationCode(): string {
  return randomBytes(32).toString('base64url');
}

// Хэширование кода верификации
export function hashCode(rawCode: string): string {
  return createHash('sha256').update(rawCode).digest('hex');
}

// Сравнение сырого кода верификации и его хэша
export function compareCode(hash: string, rawCode: string): boolean {
  const rawHash = Buffer.from(hashCode(rawCode)); // хэширование rawCode и преобразование результата в буфер
  const savedHash = Buffer.from(hash); //  преобразование hash в буфер
  return timingSafeEqual(rawHash, savedHash); // сравнивает два буфера
}

/**
 * Метод timingSafeEqual() сравнивает два буфера таким образом, чтобы избежать утечки тайминга (Timing Attacks).
 * Обычно простая проверка равенства строк выполняется быстрее, если строки различаются раньше.
 * Но этот метод сравнивает всю длину строки целиком независимо от различия значений байтов,
 * обеспечивая безопасность от атак путем анализа временных задержек.
 */
