'use client';

import { useRouter } from 'next/navigation';

export function NavButtons() {
  const router = useRouter();

  // Не показываем кнопки если мы внутри iframe
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return null;
  }

  return (
    <div className="hidden lg:flex fixed bottom-6 left-6 z-50 gap-2">
      <button
        onClick={() => router.back()}
        aria-label="Назад"
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 text-slate-600 dark:text-slate-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      <button
        onClick={() => router.forward()}
        aria-label="Вперёд"
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 text-slate-600 dark:text-slate-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}