// src/app/actions.ts
'use server'

import { getFilesByFolder, uploadFileToS3, deleteFileFromS3 } from '@/lib/s3';
import { revalidatePath } from 'next/cache';

// Получить список (вызывается клиентом)
export async function fetchFiles(currentPath: string) {
  return await getFilesByFolder(currentPath);
}

// Загрузить файл
export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || ''; // Текущая папка
  const mode = formData.get('mode') as string || 'original'; // 'original' | 'numbered'
  const number = formData.get('number') as string;

  if (!file) return { error: "No file provided" };

  // Логика переименования
  let fileName = file.name;

  if (mode === 'numbered' && number) {
    // Получаем расширение файла (например, .png)
    const ext = file.name.split('.').pop();
    // Новое имя: 5.png
    fileName = `${number}.${ext}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Ключ = папка + (новое или старое) имя
  const key = folder + fileName;

  await uploadFileToS3(buffer, key, file.type);
  
  // Обновляем кэш, чтобы файл сразу появился
  revalidatePath('/');
  return { success: true };
}

// Создать папку (в S3 это просто создание пустого файла с именем "папка/")
export async function createFolder(formData: FormData) {
  const folderName = formData.get('folderName') as string;
  const currentPath = formData.get('currentPath') as string || '';
  
  if (!folderName) return;

  // Добавляем слэш в конце, чтобы S3 понял, что это "папка"
  const key = `${currentPath}${folderName}/`;
  
  // Загружаем пустой буфер
  await uploadFileToS3(Buffer.from(''), key, 'application/x-directory');
  revalidatePath('/');
}

export async function deleteFile(key: string) {
  await deleteFileFromS3(key);
  revalidatePath('/');
}