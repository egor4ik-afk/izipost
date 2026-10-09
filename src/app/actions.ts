// src/app/actions.ts
'use server'

import { getFilesByFolder, getDownloadUrlFromS3, uploadFileToS3, deleteFileFromS3, renameFileInS3, renameFolderInS3 } from '@/lib/s3';
import { revalidatePath } from 'next/cache';
import { canAccess, requireAccess, storageUser } from '@/lib/storage-access';

// Каждое действие проверяет вход и папку (lib/storage-access): server actions вызываются
// обычным POST-запросом, и без проверки любой мог читать и менять чужие файлы.


export async function fetchFiles(currentPath: string) {
  const u = await storageUser();
  if (!canAccess(u, currentPath)) return [];
  return await getFilesByFolder(currentPath);
}
export async function getDownloadLink(key: string, fileName: string) {
  try {
    await requireAccess(key);
    const url = await getDownloadUrlFromS3(key, fileName);
    return { success: true, url };
  } catch (error) {
    console.error("Ошибка генерации ссылки на скачивание:", error);
    return { success: false, error: "Не удалось создать ссылку" };
  }
}

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || '';
  const mode = formData.get('mode') as string || 'original';
  const number = formData.get('number') as string;

  if (!file) return { error: "No file provided" };

  let fileName = file.name;
  if (mode === 'numbered' && number) {
    const ext = file.name.split('.').pop();
    fileName = `${number}.${ext}`;
  }

  const key = folder + fileName;
  await requireAccess(folder, key);
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFileToS3(buffer, key, file.type);
  revalidatePath('/');
  return { success: true };
}

export async function createFolder(formData: FormData) {
  const folderName = formData.get('folderName') as string;
  const currentPath = formData.get('currentPath') as string || '';
  if (!folderName) return;
  const key = `${currentPath}${folderName}/`;
  await requireAccess(currentPath, key);
  await uploadFileToS3(Buffer.from(''), key, 'application/x-directory');
  revalidatePath('/');
}

export async function deleteFile(key: string) {
  await requireAccess(key);
  await deleteFileFromS3(key);
  revalidatePath('/');
}

// === НОВЫЙ ЭКШЕН ===

export async function renameItem(oldKey: string, newName: string) {
  const isFolder = oldKey.endsWith('/');

  // Вычисляем родительскую директорию
  const pathParts = oldKey.split('/');
  pathParts.pop(); // удаляем имя файла (или пустую строку, если папка)
  if (isFolder) pathParts.pop(); // если папка, удаляем еще один уровень вложенности

  const parentPath = pathParts.join('/') + (pathParts.length > 0 ? '/' : '');

  // Формируем новый путь
  let newKey = parentPath + newName;
  if (isFolder && !newKey.endsWith('/')) {
    newKey += '/'; // Возвращаем слеш для папки
  }

  // И откуда, и куда — только свои папки (переименование корня вывело бы его наружу)
  await requireAccess(oldKey, newKey);

  if (isFolder) {
    await renameFolderInS3(oldKey, newKey);
  } else {
    await renameFileInS3(oldKey, newKey);
  }

  revalidatePath('/');
}