'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BBDots } from '@/components/Spinner';

export default function SignInPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Wrong password');
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bb-gradient-soft">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl card-shadow p-10 max-w-md w-full text-center">
        <Image
          src="https://bookbrush.com/custom-code/images/logo/logo-main.png"
          alt="Book Brush"
          width={180}
          height={50}
          className="h-12 w-auto mx-auto mb-6"
          unoptimized
        />
        <h1 className="text-2xl font-bold text-bb-ink mb-1">Cancellations Dashboard</h1>
        <p className="text-sm text-bb-ink/60 mb-6">Enter the team password to continue.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-bb-ink/15 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-bb-purple"
          autoFocus
        />
        {error && <div className="text-sm text-bb-magenta mb-3">{error}</div>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-bb-gradient text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-60 transition inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span>Signing in</span>
              <BBDots />
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </main>
  );
}
