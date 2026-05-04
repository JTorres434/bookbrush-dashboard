import { NextRequest, NextResponse } from 'next/server';
import { isPasswordCorrect, buildAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (typeof password !== 'string' || !isPasswordCorrect(password)) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
    }
    const cookie = await buildAuthCookie();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}
