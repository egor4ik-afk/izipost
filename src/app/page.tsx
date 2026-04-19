import type { Metadata } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import FileManager from "@/components/FileManager";
import ScreenshotTool from "@/components/ScreenshotTool";

export const metadata: Metadata = {
  title: "IziPost — Файловое хранилище с CDN для проектов",
  description: "Загружайте файлы до 5 ГБ напрямую в S3. Все ссылки автоматически работают через CDN. Бесплатно до 1 ГБ. Часть платформы RelaxDev.",
  keywords: ["файловое хранилище", "S3", "CDN", "загрузка файлов", "медиафайлы", "облако", "Yandex Cloud"],
  openGraph: {
    title: "IziPost — Файловое хранилище с CDN",
    description: "S3-совместимое хранилище. Все файлы автоматически через CDN. Бесплатно до 1 ГБ.",
    url: "https://izipost.ru",
    siteName: "IziPost",
    locale: "ru_RU",
    type: "website",
  },
  alternates: { canonical: "https://izipost.ru" },
  robots: { index: false, follow: false },
};

function Logo() {
  return (
    <div className="font-bold text-xl tracking-tight flex items-center gap-2">
      <Image src="/favicon.svg" alt="IziPost" width={32} height={32} className="rounded-lg" />
      IziPost Storage
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4">{icon}</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 font-sans">

        {/* NAV */}
        <nav className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center">
          <Logo />
          <Link href="/auth/signin" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Войти
          </Link>
        </nav>

        {/* HERO */}
        <section className="max-w-6xl mx-auto px-6 py-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 border border-indigo-100 dark:border-indigo-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Все файлы автоматически через CDN
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl text-balance">
            Файловое хранилище <br className="hidden md:block" /> с мгновенной CDN-доставкой
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-4 max-w-2xl text-balance">
            Загружайте файлы — получайте CDN-ссылки. Без настроек, без инфраструктуры.
            Каждый файл автоматически кэшируется и отдаётся из ближайшей точки CDN.
          </p>

          <p className="text-sm text-slate-400 dark:text-slate-500 mb-10">
            Бесплатно до <span className="font-semibold text-indigo-500">1 ГБ</span> · Файлы до 5 ГБ · Россия 🇷🇺
          </p>

          <Link href="/auth/signin"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
            Начать бесплатно
          </Link>
        </section>

        {/* FEATURES */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
              }
              title="CDN из коробки"
              desc="Каждый загруженный файл автоматически получает CDN-ссылку. Никаких настроек — просто загружай и копируй ссылку."
            />
            <FeatureCard
              icon={
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              }
              title="Файлы до 5 ГБ"
              desc="Presigned URLs — файлы загружаются напрямую в S3 с твоего компьютера, минуя сервер. Никаких зависаний и лимитов памяти."
            />
            <FeatureCard
              icon={
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
              }
              title="Массовые действия"
              desc="Выделяй десятки файлов чекбоксами — удаляй, копируй CDN-ссылки или скачивай прямо на диск одним кликом."
            />
          </div>
        </section>

        {/* ТАРИФ */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 md:p-10 shadow-sm">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4 border border-emerald-100 dark:border-emerald-800/30">
                  Тарифы
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Начни бесплатно,<br />расти без ограничений</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Бесплатный тариф включает 1 ГБ хранилища — достаточно для большинства проектов.
                  Расширенные тарифы с увеличенным объёмом и дополнительными функциями доступны через платформу RelaxDev.
                </p>
                <a href="https://relaxdev.ru/pricing" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Смотреть все тарифы на RelaxDev →
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">1 ГБ</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">FREE</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">CDN-ссылки, папки, массовые операции</div>
                </div>
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">∞</div>
                  <div className="text-xs text-indigo-500 uppercase tracking-wider mb-3">PRO / BUSINESS</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">На платформе RelaxDev</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELAXDEV ИНТЕГРАЦИЯ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="relative bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 md:p-10 overflow-hidden shadow-xl shadow-indigo-600/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
                  🇷🇺 Полная интеграция
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Нужна полноценная платформа?
                </h2>
                <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                  IziPost — часть экосистемы <strong className="text-white">RelaxDev</strong>.
                  Деплой сайтов и приложений из GitHub, базы данных PostgreSQL, свои домены с SSL,
                  командная работа — всё в одном месте. Российская инфраструктура, без санкций.
                </p>
                <ul className="space-y-2 mb-8">
                  {[
                    'Деплой из GitHub за секунды',
                    'PostgreSQL базы данных',
                    'Свои домены + SSL автоматически',
                    'Хранилище IziPost встроено',
                    'Команды и роли',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-indigo-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="https://relaxdev.ru" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shadow-lg">
                  Открыть RelaxDev
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                      <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <span className="text-white/60 text-xs font-mono">relaxdev.ru/dashboard</span>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Хранилище</span>
                      <span className="text-emerald-300">IziPost ✓</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>База данных</span>
                      <span className="text-emerald-300">PostgreSQL ✓</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Деплой</span>
                      <span className="text-emerald-300">GitHub → VM ✓</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>CDN</span>
                      <span className="text-emerald-300">Авто ✓</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>SSL</span>
                      <span className="text-emerald-300">Let's Encrypt ✓</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Регион</span>
                      <span className="text-white">🇷🇺 ru-central1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 dark:border-zinc-800 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <Logo />
            <div className="flex items-center gap-6">
              <a href="https://relaxdev.ru" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">RelaxDev</a>
              <a href="https://relaxdev.ru/pricing" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Тарифы</a>
            </div>
            <p>© 2026 IziPost · часть <a href="https://relaxdev.ru" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">RelaxDev</a></p>
          </div>
        </footer>
      </main>
    );
  }

  // === АВТОРИЗОВАННЫЙ ИНТЕРФЕЙС ===
  const isSuperAdmin = session.user.isSuperAdmin;
  const basePath = isSuperAdmin ? "" : `users/${session.user.email}/`;

  return (
    <main className="min-h-screen bg-white dark:bg-black py-10">
      <div className="max-w-6xl mx-auto px-4 mb-4 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">
            <strong className="text-slate-800 dark:text-slate-200">{session.user.email}</strong>
            {isSuperAdmin && " 👑"}
          </div>
          <a href="/api/auth/signout" className="text-sm text-red-500 hover:underline font-medium">Выйти</a>
        </div>
      </div>
      <ScreenshotTool />
      <FileManager basePath={basePath} />
    </main>
  );
}