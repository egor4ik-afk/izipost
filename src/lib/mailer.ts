// src/lib/mailer.ts
//
// Отправка почты (код входа).
//
// SMTP Яндекса временами не отвечает на подключение вовсе (ETIMEDOUT, command CONN) —
// и на 587, и на 465, десятки минут. Поэтому основной (EMAIL_*) ждём 5 секунд, дальше
// письмо уходит через запасной ящик (Gmail): EMAIL_FALLBACK_URL = smtp://логин:пароль@хост:порт
// или EMAIL_FALLBACK_HOST / _PORT / _USER / _PASS. Через запасной письмо идёт от его адреса
// (Gmail подменяет чужой From), имя отправителя то же, ответы — на основной ящик.
// Запасного нет — повтор основного другим портом (465 ↔ 587).

import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

type Box = { name: string; host?: string; port: number; user?: string; pass?: string };

/** Сколько ждём основной SMTP, прежде чем перейти на запасной */
const PRIMARY_WAIT_MS = 5_000;

const primary: Box = {
  name: "основной",
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
};

function fallbackBox(): Box | null {
  const url = process.env.EMAIL_FALLBACK_URL;
  if (url) {
    try {
      const u = new URL(url);
      return {
        name: "запасной", host: u.hostname, port: Number(u.port) || 587,
        user: decodeURIComponent(u.username), pass: decodeURIComponent(u.password).replace(/\s+/g, ""),
      };
    } catch {
      console.warn("[mail] EMAIL_FALLBACK_URL не разобран — запасной SMTP выключен");
    }
  }
  const { EMAIL_FALLBACK_HOST: host, EMAIL_FALLBACK_USER: user, EMAIL_FALLBACK_PASS: pass } = process.env;
  if (!host || !user || !pass) return null;
  // Пароль приложения Google показывают группами через пробел — пробелы не нужны
  return { name: "запасной", host, port: Number(process.env.EMAIL_FALLBACK_PORT) || 587, user, pass: pass.replace(/\s+/g, "") };
}

function smtp(box: Box, waitMs: number): Transporter {
  return nodemailer.createTransport({
    host: box.host,
    port: box.port,
    secure: box.port === 465,
    auth: { user: box.user, pass: box.pass },
    connectionTimeout: waitMs,
    greetingTimeout: waitMs,
    socketTimeout: 30_000,
  });
}

const fallback = fallbackBox();
const chain: { box: Box; t: Transporter }[] = [
  { box: primary, t: smtp(primary, PRIMARY_WAIT_MS) },
  fallback
    ? { box: fallback, t: smtp(fallback, 15_000) }
    : (() => {
        const alt: Box = { ...primary, name: "основной, другой порт", port: primary.port === 465 ? 587 : 465 };
        return { box: alt, t: smtp(alt, PRIMARY_WAIT_MS) };
      })(),
];

/** Письмо через чужой ящик: отправитель — его адрес с тем же именем, ответы — на основной */
function asSender(mail: SendMailOptions, box: Box): SendMailOptions {
  if (!box.user || box.user === primary.user) return mail;
  const raw = typeof mail.from === "string" ? mail.from : "";
  const name = raw.match(/^\s*"?([^"<]+?)"?\s*</)?.[1];
  const original = raw.match(/<([^>]+)>/)?.[1] ?? (raw.includes("@") ? raw.trim() : undefined);
  return { ...mail, from: name ? `"${name}" <${box.user}>` : box.user, replyTo: mail.replyTo ?? original };
}

async function attempt<T>(what: string, run: (t: Transporter, box: Box) => Promise<T>): Promise<T> {
  let last: unknown;
  for (const { box, t } of chain) {
    try {
      const result = await run(t, box);
      if (box !== primary) console.log(`[mail] ${what}: ушло через ${box.name} SMTP ${box.host}:${box.port}`);
      return result;
    } catch (e) {
      last = e;
      const code = (e as { code?: string }).code ?? "";
      console.warn(`[mail] ${what}: ${box.name} SMTP ${box.host}:${box.port} не сработал: ${code} ${(e as Error).message}`);
    }
  }
  throw last;
}

export const sendMail = (mail: SendMailOptions) =>
  attempt("письмо", (t, box) => t.sendMail(asSender(mail, box)));
