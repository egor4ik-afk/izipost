'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchFiles, uploadFile, deleteFile, createFolder, renameItem } from '@/app/actions';
import Image from 'next/image';

// --- КОНСТАНТЫ ---
// const MAX_FILE_SIZE = 4.4 * 1024 * 1024; // Лимит Vercel на ОДИН файл

// --- ИКОНКИ ---
const Icons = {
  Folder: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-indigo-400 dark:text-indigo-500 mx-auto">
      <path d="M19.5 21a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-10.5a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h10.5Z" opacity="0.4" />
      <path d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Z" />
      <path fillRule="evenodd" d="M3.56 9.682A3 3 0 0 1 6.38 7.5h11.24a3 3 0 0 1 2.82 2.182l1.626 6.503A3 3 0 0 1 19.153 20H4.847a3 3 0 0 1-2.913-3.815l1.626-6.503ZM6.236 9.77a1.5 1.5 0 0 1 1.41-.77h8.708a1.5 1.5 0 0 1 1.41.77l1.24 4.962a.75.75 0 0 1-.728.932H5.724a.75.75 0 0 1-.728-.932l1.24-4.962Z" clipRule="evenodd" />
    </svg>
  ),
  File: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  Back: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
    </svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
    </svg>
  ),
};

interface Item {
  name: string;
  path: string;
  type: 'file' | 'folder';
  url?: string;
}

export default function FileManager() {
  const [path, setPath] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Состояния загрузки
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [renameMode, setRenameMode] = useState<'original' | 'numbered'>('original');
  const [startNumber, setStartNumber] = useState<number>(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [path]);

  async function loadFiles() {
    setLoading(true);
    const data = await fetchFiles(path);
    setItems(data as Item[]);
    setLoading(false);
  }

  // === ЛОГИКА ПЕРЕИМЕНОВАНИЯ (С СОХРАНЕНИЕМ РАСШИРЕНИЯ) ===
  const handleRename = async (e: React.MouseEvent, item: Item) => {
    e.stopPropagation(); 
    
    // Отделяем имя от расширения
    const lastDotIndex = item.name.lastIndexOf('.');
    let nameWithoutExt = item.name;
    let extension = "";

    // Если это файл и у него есть расширение
    if (item.type === 'file' && lastDotIndex !== -1) {
        nameWithoutExt = item.name.substring(0, lastDotIndex);
        extension = item.name.substring(lastDotIndex); // например ".jpg"
    }

    // Показываем в prompt только имя (без .jpg)
    const newNameInput = prompt(`Переименовать "${item.name}" в:`, nameWithoutExt);
    
    if (newNameInput && newNameInput !== nameWithoutExt) {
      // Собираем обратно
      const finalName = newNameInput + extension;
      
      setLoading(true);
      await renameItem(item.path, finalName);
      await loadFiles();
      setLoading(false);
    }
  };
  
  // === ЛОГИКА УДАЛЕНИЯ ===
  const handleDelete = async (e: React.MouseEvent, itemPath: string) => {
      e.stopPropagation();
      if(confirm('Удалить безвозвратно?')) { 
          setLoading(true); 
          await deleteFile(itemPath); 
          await loadFiles(); 
      }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) return;
    const files = Array.from(fileInputRef.current.files);
    
    setUploading(true);
    let currentNumber = startNumber; 

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Загрузка ${i + 1} из ${files.length}`);

        /* if (file.size > MAX_FILE_SIZE) {
            alert(`⚠️ Файл "${file.name}" пропущен: слишком большой (>4.4MB)`);
            continue;
        } */

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', path);
        formData.append('mode', renameMode);
        
        if (renameMode === 'numbered') {
            formData.append('number', currentNumber.toString());
            currentNumber++; 
        }

        try { await uploadFile(formData); } catch (e) { console.error(e); }
    }
    
    await loadFiles();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (renameMode === 'numbered') setStartNumber(currentNumber);
    setUploading(false);
    setUploadProgress("");
  };

  const goUp = () => {
    if (!path) return;
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    setPath(parts.length ? parts.join('/') + '/' : "");
  };

  const copyAllLinks = () => {
    const links = items.filter(i => i.type === 'file' && i.url).map(i => i.url).join('\n');
    navigator.clipboard.writeText(links);
    alert('Ссылки скопированы!');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-sans text-slate-800 dark:text-slate-100">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
            <button onClick={goUp} disabled={!path} className="p-2 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all">
                <Icons.Back />
            </button>
            <div className="bg-slate-100 dark:bg-zinc-800/50 px-4 py-2 rounded-lg font-mono text-sm border border-slate-200 dark:border-zinc-700/50 break-all">
                root/{path}
            </div>
        </div>
        <button onClick={copyAllLinks} className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
            <Icons.Copy /> Копировать все ссылки
        </button>
      </header>

      {/* CONTROLS */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row gap-6">
            <form action={async (formData) => { await createFolder(formData); loadFiles(); }} className="flex gap-2 items-end xl:w-1/3">
               <input type="hidden" name="currentPath" value={path} />
               <div className="w-full">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Новая папка</label>
                  <div className="flex gap-2">
                     <input name="folderName" placeholder="Название..." required className="flex-1 px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                     <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-200 rounded-lg font-bold transition-colors">+</button>
                  </div>
               </div>
            </form>
            <div className="w-px bg-slate-200 dark:bg-zinc-800 hidden xl:block"></div>
            <form onSubmit={handleUpload} className="flex-1 flex flex-col gap-2">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{uploading ? uploadProgress : 'Загрузка файлов'}</label>
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                 <div className="inline-flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <button type="button" onClick={() => setRenameMode('original')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${renameMode === 'original' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Имя</button>
                    <button type="button" onClick={() => setRenameMode('numbered')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${renameMode === 'numbered' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Число</button>
                 </div>
                 {renameMode === 'numbered' && (
                     <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                        <span className="text-sm text-slate-500 font-medium">№</span>
                        <input type="number" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)} className="w-20 px-2 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-950 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                     </div>
                 )}
                 <input ref={fileInputRef} type="file" name="file" multiple required className="flex-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-zinc-800 dark:file:text-indigo-400 cursor-pointer" />
                 <button type="submit" disabled={uploading} className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95 whitespace-nowrap">{uploading ? 'Ждите...' : 'Загрузить'}</button>
               </div>
               {uploading && <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1"><div className="h-full bg-indigo-500 animate-pulse w-full"></div></div>}
            </form>
        </div>
      </div>
      
      {/* GRID */}
      {loading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <div key={item.path} className="group relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
              
              {/* --- ДЕЙСТВИЯ (ТЕПЕРЬ ВСЕГДА ВИДНЫ) --- */}
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                 <button 
                    onClick={(e) => handleRename(e, item)}
                    className="p-1.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 rounded-full shadow-sm border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300"
                    title="Переименовать"
                 >
                    <Icons.Edit />
                 </button>
                 <button 
                    onClick={(e) => handleDelete(e, item.path)}
                    className="p-1.5 bg-red-50/90 hover:bg-red-100 dark:bg-red-900/50 dark:hover:bg-red-900/80 rounded-full shadow-sm border border-red-200 dark:border-red-800 text-red-500"
                    title="Удалить"
                 >
                    <Icons.Trash />
                 </button>
              </div>

              {item.type === 'folder' ? (
                <div onClick={() => setPath(item.path)} className="cursor-pointer p-6 flex-1 flex flex-col items-center justify-center bg-indigo-50/30 dark:bg-zinc-800/30 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors">
                  <Icons.Folder />
                  <div className="mt-3 font-medium text-slate-700 dark:text-slate-200 text-sm truncate w-full text-center">{item.name}</div>
                </div>
              ) : (
                <>
                  <div className="relative aspect-square w-full bg-slate-50 dark:bg-black flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-zinc-800">
                    {item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Image src={item.url!} alt={item.name} fill className="object-contain p-2" sizes="(max-width: 768px) 100vw, 20vw" />
                    ) : (
                      <Icons.File />
                    )}
                  </div>
                  
                  {/* ИНФО + КНОПКА ОТКРЫТЬ (ВСЕГДА ВИДНА) */}
                  <div className="p-3 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate select-all" title={item.name}>{item.name}</p>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline border border-indigo-100 dark:border-indigo-900/30 rounded py-1 bg-indigo-50 dark:bg-indigo-900/10">
                        Открыть
                    </a>
                  </div>
                </>
              )}
            </div>
          ))}
          {!items.length && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50">
               <Icons.Folder />
               <p className="mt-2 text-sm">Эта папка пуста</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}