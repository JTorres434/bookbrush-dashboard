'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();

  const onSignOut = async () => {
    await fetch('/api/signout', { method: 'POST' });
    router.push('/signin');
    router.refresh();
  };

  return (
    <header className="bg-bb-gradient text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="https://bookbrush.com/custom-code/images/logo/logo-main.png"
            alt="Book Brush"
            width={140}
            height={40}
            className="h-10 w-auto bg-white rounded px-2 py-1"
            unoptimized
          />
          <span className="text-white/80 hidden sm:inline">|</span>
          <h1 className="font-semibold tracking-tight hidden sm:inline">Cancellations Dashboard</h1>
        </div>
        <button
          onClick={onSignOut}
          className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
