import { auth } from "@/auth";
import Link from "next/link";
import FileManager from "@/components/FileManager";
import ScreenshotTool from "@/components/ScreenshotTool";

export default async function Home() {
  // 1. Проверяем авторизацию
  const session = await auth();

  // === ЛЕНДИНГ ДЛЯ НЕАВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ ===
  if (!session?.user) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 font-sans">
        {/* Навигация */}
        <nav className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 5.25 20.25H16.5a5.25 5.25 0 0 0 2.516-10.025 7.5 7.5 0 0 0-8.516-6.475ZM9 11.25a.75.75 0 0 0-1.5 0v2.69l-.72-.72a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 1 0-1.06-1.06l-.72.72V11.25Z" clipRule="evenodd" />
              </svg>
            </span>
            IziPost CMS
          </div>
          <Link href="/api/auth/signin" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Войти
          </Link>
        </nav>

        {/* Главный блок (Hero) */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 border border-indigo-100 dark:border-indigo-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            S3 Bucket настроен и работает через CDN
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl text-balance">
            Мощное файловое хранилище <br className="hidden md:block"/> для ваших проектов
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl text-balance">
            Загружайте файлы любого размера напрямую в облако. 
            Все ваши медиафайлы автоматически кэшируются и отдаются через глобальную сеть доставки контента (CDN) с максимальной скоростью.
          </p>
          
          <Link href="/api/auth/signin" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
            Войти в систему
          </Link>
        </section>

        {/* Блок с фичами */}
        <section className="max-w-6xl mx-auto px-6 pb-32">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Молниеносный CDN</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Файлы отдаются не с одного сервера, а из ближайшей к вашему пользователю точки присутствия Yandex Cloud CDN. Картинки загружаются мгновенно.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Файлы до 5 ГБ</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Благодаря технологии Presigned URLs, файлы загружаются с вашего компьютера напрямую в S3, минуя бэкенд. Никаких зависаний и лимитов памяти.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Массовые действия</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Выделяйте десятки файлов чекбоксами для одновременного удаления, копирования ссылок или умного скачивания прямо на жесткий диск.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // === ИНТЕРФЕЙС CMS ДЛЯ АВТОРИЗОВАННЫХ ===
  // Вычисляем базовую папку
  const isSuperAdmin = session.user.isSuperAdmin;
  const basePath = isSuperAdmin ? "" : `users/${session.user.email}/`;

  return (
    <main className="min-h-screen bg-white dark:bg-black py-10">
      
      {/* Шапка с информацией о пользователе */}
      <div className="max-w-6xl mx-auto px-4 mb-4 flex justify-between items-center">
        <div className="text-sm text-slate-500">
          Вы вошли как: <strong className="text-slate-800 dark:text-slate-200">{session.user.email}</strong> {isSuperAdmin && "👑 (Admin)"}
        </div>
        <a href="/api/auth/signout" className="text-sm text-red-500 hover:underline font-medium">
          Выйти
        </a>
      </div>

      {/* Инструмент скриншотов */}
      <ScreenshotTool />

      {/* Файловый менеджер с ограничением пути */}
      <FileManager basePath={basePath} />
      
    </main>
  );
}