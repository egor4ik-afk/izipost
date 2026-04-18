import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";

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
  trustHost: true, // 🔥 обязательно для iframe / reverse proxy

  pages: {
    signIn: '/auth/signin',
  },

  // 🔥 Настройка cookies — убираем SameSite=Lax, иначе iframe блокирует
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none', // 🔥 none = работает в iframe
        path: '/',
        secure: true,     // 🔥 обязательно при sameSite: none
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },

  providers: [
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;
        const email = credentials.email as string;
        const otp = credentials.otp as string;

        const vt = await prisma.verificationToken.findUnique({
          where: { identifier_token: { identifier: email, token: otp } },
        });

        if (!vt || vt.expires < new Date()) return null;

        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: email, token: otp } },
        });

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({ data: { email } });
        }
        return user;
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const bcrypt = await import("bcryptjs");
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email as string } 
        });
        if (!user || !user.password) return null;
        
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.password
        );
        if (isValid) return user;
        return null;
      },
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
        session.user.isSuperAdmin =
          token.email === "kamrikalive@gmail.com" ||
          token.email === "webbuildge@gmail.com" ||
          token.email === "alexei.revenck@yandex.ru";
      }
      return session;
    },
  },
});