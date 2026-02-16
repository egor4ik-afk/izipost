import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Nodemailer from "next-auth/providers/nodemailer";

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
  
  // 🔥 НОВОЕ: Указываем пути к нашим кастомным красивым страницам
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
      from: process.env.EMAIL_USER,
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
        
        // 🔥 ОПРЕДЕЛЯЕМ СУПЕРАДМИНА
        session.user.isSuperAdmin = token.email === "kamrikalive@gmail.com";
      }
      return session;
    }
  }
});