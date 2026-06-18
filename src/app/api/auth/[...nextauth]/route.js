// src/app/api/auth/[...nextauth]/route.js

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ CRITICAL: NEXTAUTH_SECRET is not set!');
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required');
          }

          const normalizedEmail = credentials.email.toLowerCase().trim();
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) throw new Error('No user found with this email');
          if (user.isActive === false) throw new Error('Account is deactivated');
          if (!user.password) throw new Error('Invalid credentials');

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) throw new Error('Invalid password');

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