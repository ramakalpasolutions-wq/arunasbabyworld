import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback_secret';

// ✅ Re-export authOptions so any file importing from @/lib/auth also works
export { authOptions };

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const getSession = async () => {
  return getServerSession(authOptions);
};

export const isAdmin = async () => {
  const session = await getSession();
  return session?.user?.role === 'admin';
};

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  return session;
};

export const requireAdmin = async () => {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') throw new Error('Not authorized');
  return session;
};