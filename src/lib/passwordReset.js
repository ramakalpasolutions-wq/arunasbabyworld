import jwt from 'jsonwebtoken';

// Password-reset links carry a signed token instead of anything stored in the database.
// The signing key includes the user's current password hash, so a link:
//   - expires after 30 minutes
//   - stops working the moment the password is changed (one use only)

const BASE_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '';
export const RESET_LINK_MINUTES = 30;

const keyFor = (user) => `${BASE_SECRET}.${user.password}`;

export function createResetToken(user) {
  if (!BASE_SECRET) throw new Error('JWT_SECRET / NEXTAUTH_SECRET is not set');
  return jwt.sign({ uid: user.id, purpose: 'password-reset' }, keyFor(user), {
    expiresIn: `${RESET_LINK_MINUTES}m`,
  });
}

/** The user id inside a token, without trusting it yet. */
export function peekResetUserId(token) {
  const decoded = jwt.decode(String(token || ''));
  const uid = decoded && typeof decoded === 'object' ? decoded.uid : null;
  return typeof uid === 'string' && /^[a-f0-9]{24}$/i.test(uid) ? uid : null;
}

/** True only for an unexpired token that was issued for this user's current password. */
export function isValidResetToken(token, user) {
  if (!BASE_SECRET || !user?.password) return false;
  try {
    const payload = jwt.verify(String(token || ''), keyFor(user));
    return payload.uid === user.id && payload.purpose === 'password-reset';
  } catch {
    return false;
  }
}

export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return '';
  const shown = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(3, name.length - shown.length))}@${domain}`;
}
