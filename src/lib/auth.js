import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback_secret';

// ✅ Sign JWT token
export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// ✅ Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// ✅ Get NextAuth session (server side)
export const getSession = async () => {
  return getServerSession(authOptions);
};

// ✅ Check if admin
export const isAdmin = async () => {
  const session = await getSession();
  return session?.user?.role === 'admin';
};

// ✅ Require auth — throws if not logged in
export const requireAuth = async () => {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
};

// ✅ Require admin — throws if not admin
export const requireAdmin = async () => {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    throw new Error('Not authorized');
  }
  return session;
};