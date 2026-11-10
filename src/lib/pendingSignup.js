// Carries what a new shopper typed on the login page over to the register page.
// Kept in memory only (never in the URL or browser storage) and cleared once read.

let pending = null;

export function setPendingSignup(details) {
  pending = details ? { ...details, at: Date.now() } : null;
}

export function takePendingSignup() {
  const value = pending;
  pending = null;
  // Ignore anything older than 10 minutes
  if (!value || Date.now() - value.at > 10 * 60 * 1000) return null;
  return value;
}
