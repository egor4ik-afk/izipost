// src/lib/mailer.ts
//
// Отправка почты через SMTP (EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS).
// SMTP Яндекса иногда минутами не отвечает на подключение (ETIMEDOUT, command CONN):
// по умолчанию nodemailer ждёт подключения 2 минуты, и человек столько же ждёт код входа.
// Поэтому ждём 10 секунд, а при сетевой ошибке пробуем ещё раз — другим портом
// (465 — SSL, 587 — STARTTLS), потом снова прежним. Ошибку логина не повторяем.

import { createTransport, type SendMailOptions, type Transporter } from "nodemailer";

const HOST = process.env.EMAIL_HOST;
const PORT = Number(process.env.EMAIL_PORT) || 587;

function transport(port: number): Transporter {
  return createTransport({
    host: HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
}

const main = transport(PORT);
const other = transport(PORT === 465 ? 587 : 465);

/** Ошибки сети и подключения — их имеет смысл повторить */
const RETRY = new Set(["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNRESET", "ECONNREFUSED", "EDNS"]);

export async function sendMail(mail: SendMailOptions) {
  let last: unknown;
  for (const [i, t] of [main, other, main].entries()) {
    try {
      return await t.sendMail(mail);
    } catch (e) {
      last = e;
      const code = (e as { code?: string }).code ?? "";
      if (!RETRY.has(code)) throw e;
      console.warn(`[mail] попытка ${i + 1} не удалась: ${code} ${(e as Error).message}`);
    }
  }
  throw last;
}
