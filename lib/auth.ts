import { createHmac, timingSafeEqual } from 'crypto';

// Simple password-based session: a signed cookie token.
// On signin: if password matches DASHBOARD_PASSWORD, set a cookie with HMAC.
// On request: verify the cookie HMAC against the env var.

const COOKIE_NAME = 'bb_dash_auth';

function expectedToken(): string {
  const secret = process.env.SESSION_SECRET || '';
  const password = process.env.DASHBOARD_PASSWORD || '';
  if (!secret || !password) return '';
  return createHmac('sha256', secret).update(password).digest('hex');
}

export function isPasswordCorrect(input: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  if (!expected) return false;
  // Constant-time comparison
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildAuthCookie() {
  const value = expectedToken();
  return {
    name: COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

export function clearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    },
  };
}

export function isAuthCookieValid(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = expectedToken();
  if (!expected) return false;
  if (cookieValue.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(cookieValue), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
