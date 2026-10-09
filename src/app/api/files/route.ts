// src/app/api/files/route.ts
//
// Файлы бакета для менеджера файлов izipost: список, ссылка на загрузку, переименование,
// удаление. Только после входа и только в своих папках (lib/storage-access): раньше роут
// был открыт всем, да ещё с CORS * — любой сайт мог читать и менять файлы всех
// пользователей. Вызывает его только сам izipost, поэтому CORS не нужен.

import { NextRequest, NextResponse } from 'next/server';
import {
  s3,
  bucketName,
  getFilesByFolder,
  renameFileInS3,
  renameFolderInS3,
} from '@/lib/s3';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { canAccess, storageUser } from '@/lib/storage-access';

function deny(status: 401 | 403) {
  return NextResponse.json({ success: false, error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status });
}

// Список файлов и папок
export async function GET(request: NextRequest) {
  const u = await storageUser();
  if (!u) return deny(401);
  try {
    const prefix = new URL(request.url).searchParams.get('prefix') || '';
    if (!canAccess(u, prefix)) return deny(403);
    const filesAndFolders = await getFilesByFolder(prefix);
    return NextResponse.json({ success: true, files: filesAndFolders });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ success: false, error: 'Failed to list files' }, { status: 500 });
  }
}

// Presigned URL для загрузки
export async function POST(request: NextRequest) {
  const u = await storageUser();
  if (!u) return deny(401);
  try {
    const { fileName, fileType, prefix } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: 'fileName and fileType are required' }, { status: 400 });
    }

    // Имя сохраняется точь-в-точь как передал клиент
    const key = `${prefix || ''}${fileName}`;
    if (!canAccess(u, prefix) || !canAccess(u, key)) return deny(403);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to create presigned URL' }, { status: 500 });
  }
}

// Переименование файлов и папок
export async function PUT(request: NextRequest) {
  const u = await storageUser();
  if (!u) return deny(401);
  try {
    const { oldKey, newKey, type } = await request.json();

    if (!oldKey || !newKey || !type) {
      return NextResponse.json({ success: false, error: 'oldKey, newKey and type are required' }, { status: 400 });
    }
    if (!canAccess(u, oldKey) || !canAccess(u, newKey)) return deny(403);

    if (type === 'file') {
      await renameFileInS3(oldKey, newKey);
    } else if (type === 'folder') {
      await renameFolderInS3(oldKey, newKey);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type specified' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${type} renamed successfully` });
  } catch (error) {
    console.error('Error renaming:', error);
    return NextResponse.json({ success: false, error: 'Failed to rename' }, { status: 500 });
  }
}

// Удаление файла
export async function DELETE(request: NextRequest) {
  const u = await storageUser();
  if (!u) return deny(401);
  try {
    const key = new URL(request.url).searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'File key is required' }, { status: 400 });
    }
    if (!canAccess(u, key)) return deny(403);

    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
}
