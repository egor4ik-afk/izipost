// src/app/actions.ts
'use server'

import { getFilesByFolder, uploadFileToS3, deleteFileFromS3, renameFileInS3, renameFolderInS3 } from '@/lib/s3';
import { revalidatePath } from 'next/cache';

// ... (fetchFiles, uploadFile, createFolder, deleteFile оставляем без изменений) ...

export async function fetchFiles(currentPath: string) {
  return await getFilesByFolder(currentPath);
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = folder + fileName;

  await uploadFileToS3(buffer, key, file.type);
  revalidatePath('/');
  return { success: true };
}

export async function createFolder(formData: FormData) {
  const folderName = formData.get('folderName') as string;
  const currentPath = formData.get('currentPath') as string || '';
  if (!folderName) return;
  const key = `${currentPath}${folderName}/`;
  await uploadFileToS3(Buffer.from(''), key, 'application/x-directory');
  revalidatePath('/');
}

export async function deleteFile(key: string) {
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
  
  if (isFolder) {
      await renameFolderInS3(oldKey, newKey);
  } else {
      await renameFileInS3(oldKey, newKey);
  }

  revalidatePath('/');
}