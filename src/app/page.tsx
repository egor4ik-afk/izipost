'use client';

import { useState } from 'react';
import FileManager from '@/components/FileManager';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setResult(null);

    try {
      // Стучимся в наш новый API
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data.url);
        setUrl('');
        // Можно перезагрузить страницу или список файлов, чтобы увидеть новый файл
        // window.location.reload(); 
      } else {
        alert('Ошибка создания скриншота: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black py-10">
      
      {/* --- БЛОК ГЕНЕРАТОРА СКРИНШОТОВ --- */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            📸 Создать превью сайта
          </h2>
          
          <form onSubmit={handleScreenshot} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="url" 
              placeholder="Вставьте ссылку (https://...)" 
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all whitespace-nowrap"
            >
              {loading ? 'Обработка...' : 'Сделать скриншот'}
            </button>
          </form>

          {/* Результат успеха */}
          {result && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-green-800 dark:text-green-300 font-medium">✅ Скриншот успешно создан и сохранен в папку preview!</span>
              <a href={result} target="_blank" className="text-sm underline text-green-700 dark:text-green-400 font-bold">Посмотреть</a>
            </div>
          )}
        </div>
      </div>

      {/* --- ВАШ ФАЙЛОВЫЙ МЕНЕДЖЕР --- */}
      <FileManager />
      
    </main>
  );
}