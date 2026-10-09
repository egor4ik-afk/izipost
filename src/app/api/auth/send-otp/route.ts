// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransport } from "nodemailer";
import crypto from "crypto";

// Новый код — не чаще раза в минуту на почту: иначе роут шлёт письма без ограничений
const RESEND_MS = 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Неверный email" }, { status: 400 });
  }

  const last = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (last && last.expires.getTime() - CODE_TTL_MS > Date.now() - RESEND_MS) {
    return NextResponse.json({ error: "Код уже отправлен, повторить можно через минуту" }, { status: 429 });
  }

  // Генерируем 6-значный код
  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + CODE_TTL_MS); // 10 минут

  // Удаляем старые токены для этого email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // Сохраняем новый
  await prisma.verificationToken.create({
    data: { identifier: email, token: code, expires },
  });

  // Отправляем письмо
  const transport = createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transport.sendMail({
    to: email,
    from: `"IziPost" <${process.env.EMAIL_USER}>`,
    subject: "Код входа в IziPost",
    text: `Ваш код для входа: ${code}\n\nКод действителен 10 минут.`,
    html: `
      <body style="background-color:#f9fafb;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:500px;margin:0 auto;background:#fff;padding:40px;border-radius:24px;box-shadow:0 4px 6px rgba(0,0,0,0.05);text-align:center;">
          <h1 style="color:#111827;font-size:24px;font-weight:800;margin-bottom:20px;">Вход в IziPost CMS</h1>
          <p style="color:#4b5563;font-size:16px;margin-bottom:30px;line-height:1.6;">
            Ваш код для входа:
          </p>
          <div style="display:inline-block;padding:16px 40px;background:#f3f4f6;border-radius:16px;font-size:36px;font-weight:800;letter-spacing:8px;color:#111827;margin-bottom:30px;">
            ${code}
          </div>
          <p style="color:#9ca3af;font-size:14px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:20px;">
            Код действителен 10 минут. Если вы не запрашивали вход — проигнорируйте письмо.
          </p>
        </div>
      </body>
    `,
  });

  return NextResponse.json({ success: true });
}