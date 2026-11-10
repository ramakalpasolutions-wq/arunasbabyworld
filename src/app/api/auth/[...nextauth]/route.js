// src/app/api/auth/[...nextauth]/route.js

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyCaptcha, clientIp } from '@/lib/turnstile';
import { normalizePhone } from '@/lib/phone';

if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ CRITICAL: NEXTAUTH_SECRET is not set!');
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone:    { label: 'Phone',    type: 'tel' },
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
        captchaToken: { label: 'Captcha', type: 'text' },
      },
      async authorize(credentials, req) {
        try {
          // Human verification comes first, before any database lookup
          const human = await verifyCaptcha(credentials?.captchaToken, clientIp(req?.headers));
          if (!human) throw new Error('CAPTCHA_FAILED');

          // Shoppers sign in with their phone number. The admin login, and older
          // accounts that never saved a phone number, sign in with their email.
          const identifier = String(credentials?.phone || credentials?.email || '').trim();

          if (!identifier || !credentials?.password) {
            throw new Error('Phone number and password required');
          }

          let candidates = [];

          if (identifier.includes('@')) {
            const byEmail = await prisma.user.findUnique({
              where: { email: identifier.toLowerCase() },
            });
            if (byEmail) candidates = [byEmail];
          } else {
            const phone = normalizePhone(identifier);
            if (!phone) throw new Error('INVALID_PHONE');

            // Older records may be stored as "+91 98765 43210" etc., so match on the last 10 digits
            const matches = await prisma.user.findMany({
              where: { phone: { endsWith: phone } },
            });
            candidates = matches.filter((u) => normalizePhone(u.phone) === phone);
          }

          if (candidates.length === 0) throw new Error('USER_NOT_FOUND');

          // A phone number can belong to more than one old account: accept the one whose password matches
          let user = null;
          for (const candidate of candidates) {
            if (!candidate.password) continue;
            if (await bcrypt.compare(credentials.password, candidate.password)) {
              user = candidate;
              break;
            }
          }

          if (!user) throw new Error('Invalid password');
          if (user.isActive === false) throw new Error('Account is deactivated');

          console.log('✅ Login successful for:', user.email);

          return {
            id:     user.id,
            name:   user.name,
            email:  user.email,
            role:   user.role,
            avatar: user.avatar || null,
          };
        } catch (error) {
          console.error('❌ Auth error:', error.message);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id     = user.id;
        token.role   = user.role;
        token.avatar = user.avatar;
        token.name   = user.name;
        token.email  = user.email;
        console.log('🔑 JWT created for:', user.email);
      }

      if (trigger === 'update' && session) {
        if (session.name)   token.name   = session.name;
        if (session.email)  token.email  = session.email;
        if (session.avatar) token.avatar = session.avatar;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id     = token.id;
        session.user.role   = token.role;
        session.user.avatar = token.avatar;
        session.user.name   = token.name;
        session.user.email  = token.email;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy:  'jwt',
    maxAge:    30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  // ✅ Enable debug to see what's happening
 debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };