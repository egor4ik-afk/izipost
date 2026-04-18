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

  pages: {
    signIn: '/auth/signin',
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