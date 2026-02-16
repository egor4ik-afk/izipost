import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Nodemailer from "next-auth/providers/nodemailer";
import { createTransport } from "nodemailer";

// Расширяем типы сессии, чтобы TypeScript понимал поле isSuperAdmin
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      isSuperAdmin: boolean;
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      // 🔥 1. МЕНЯЕМ ИМЯ ОТПРАВИТЕЛЯ ТУТ:
      from: `"IziPost" <${process.env.EMAIL_USER}>`, 
      
      // 🔥 2. СОЗДАЕМ СВОЙ ШАБЛОН ПИСЬМА:
      sendVerificationRequest: async (params) => {
        const { identifier, url, provider } = params;
        const transport = createTransport(provider.server);
        
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Вход в панель IziPost", // Заголовок письма
          text: `Перейдите по ссылке для входа в систему:\n${url}\n\nЕсли вы не запрашивали это письмо, проигнорируйте его.`,
          html: `
            <body style="background-color: #f9fafb; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); text-align: center;">
                <h1 style="color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 20px;">
                  Вход в IziPost CMS
                </h1>
                <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
                  Мы получили запрос на вход в вашу учетную запись. <br/>Нажмите на кнопку ниже, чтобы войти в систему. Пароль не требуется!
                </p>
                <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; margin-bottom: 30px;">
                  Войти в систему
                </a>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                  Если вы не запрашивали это письмо, просто удалите его. Ваша учетная запись в безопасности.
                </p>
              </div>
            </body>
          `,
        });
        
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Не удалось отправить письмо на: ${failed.join(", ")}`);
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        
        session.user.isSuperAdmin = token.email === "kamrikalive@gmail.com";
      }
      return session;
    }
  }
});