import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const getSession = async (req) => {
  return getServerSession(authOptions);
};

export const isAdmin = async (req) => {
  const session = await getSession(req);
  return session?.user?.role === 'admin';
};

export const requireAuth = async (req) => {
  const session = await getSession(req);
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
};

export const requireAdmin = async (req) => {
  const session = await getSession(req);
  if (!session || session.user.role !== 'admin') {
    throw new Error('Not authorized');
  }
  return session;
};
