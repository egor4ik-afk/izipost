'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (res.ok) {
      setStep('code');
    } else {
      setError('Не удалось отправить код. Попробуйте ещё раз.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('otp', {
      email,
      otp: code,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (res?.error) {
      setError('Неверный или просроченный код. Попробуйте ещё раз.');
    } else if (res?.url) {
      window.location.href = res.url;
    }
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
      {step === 'email' ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Вход в систему</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Введите ваш email — мы отправим код для входа
            </p>
          </div>

          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email адрес
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
            >
              {loading ? <Spinner /> : 'Получить код'}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Введите код</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Мы отправили 6-значный код на{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Код из письма
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center text-2xl font-bold tracking-widest"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
            >
              {loading ? <Spinner /> : 'Войти'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-center"
            >
              ← Изменить email
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 font-sans text-slate-900 dark:text-slate-100">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl flex items-center justify-center h-48">
          <Spinner />
        </div>
      }>
        <SignInForm />
      </Suspense>
    </div>
  );
}