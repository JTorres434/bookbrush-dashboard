'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LiveUpdatesToggle } from './LiveUpdatesToggle';
import { DarkModeToggle } from './DarkModeToggle';
import { GlobalSearch } from './GlobalSearch';
import type { SheetRow } from '@/lib/sheets';

export function Header({
  ac, fc, fp, resub,
}: {
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}) {
  const router = useRouter();

  const onSignOut = async () => {
    await fetch('/api/signout', { method: 'POST' });
    router.push('/signin');
    router.refresh();
  };

  return (
    <header className="bg-bb-gradient text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
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
        <div className="flex items-center gap-2 flex-wrap">
          <GlobalSearch ac={ac} fc={fc} fp={fp} resub={resub} />
          <LiveUpdatesToggle />
          <DarkModeToggle />
          <button
            onClick={onSignOut}
            className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
