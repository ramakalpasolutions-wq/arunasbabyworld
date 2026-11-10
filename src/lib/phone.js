// Indian mobile numbers: stored and compared as the plain 10 digits.

/** "+91 98765 43210" -> "9876543210". Returns '' when it is not a valid 10-digit mobile number. */
export function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
}

export function isValidPhone(value) {
  return normalizePhone(value) !== '';
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}
