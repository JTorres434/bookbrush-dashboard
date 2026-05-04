// Edge-runtime-safe password auth using Web Crypto API.
// Works in both Vercel edge middleware and Node API routes.

const COOKIE_NAME = 'bb_dash_auth';

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function expectedToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET || '';
  const password = process.env.DASHBOARD_PASSWORD || '';
  if (!secret || !password) return '';
  return hmacSha256Hex(secret, password);
}

// Constant-ish-time string compare (avoids early exit on first mismatch)
function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isPasswordCorrect(input: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  if (!expected) return false;
  return safeStringEqual(input, expected);
}

export async function buildAuthCookie() {
  const value = await expectedToken();
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

export async function isAuthCookieValid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await expectedToken();
  if (!expected) return false;
  return safeStringEqual(cookieValue, expected);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
