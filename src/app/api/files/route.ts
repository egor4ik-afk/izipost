
import { NextRequest, NextResponse } from 'next/server';
import { 
  s3, 
  bucketName,
  getFilesByFolder, // Используем готовую функцию
  renameFileInS3,
  renameFolderInS3 
} from '@/lib/s3';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers });
}

// GET-метод для получения списка файлов и папок
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || ''; // Получаем префикс из запроса

    const filesAndFolders = await getFilesByFolder(prefix); // Вызываем нашу функцию
    
    return NextResponse.json({ success: true, files: filesAndFolders }, { headers });

  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ success: false, error: 'Failed to list files' }, { status: 500, headers });
  }
}

// POST-метод для создания presigned URL для загрузки
export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, prefix } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: 'fileName and fileType are required' }, { status: 400, headers });
    }
    
    const key = `${prefix || ''}${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ success: true, url, key }, { headers });

  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to create presigned URL' }, { status: 500, headers });
  }
}

// PUT-метод для переименования файлов и папок
export async function PUT(request: NextRequest) {
    try {
        const { oldKey, newKey, type } = await request.json();

        if (!oldKey || !newKey || !type) {
            return NextResponse.json({ success: false, error: 'oldKey, newKey and type are required' }, { status: 400, headers });
        }

        if (type === 'file') {
            await renameFileInS3(oldKey, newKey);
        } else if (type === 'folder') {
            await renameFolderInS3(oldKey, newKey);
        } else {
            return NextResponse.json({ success: false, error: 'Invalid type specified' }, { status: 400, headers });
        }

        return NextResponse.json({ success: true, message: `${type} renamed successfully` }, { headers });

    } catch (error) {
        console.error(`Error renaming ${'type'}:`, error);
        return NextResponse.json({ success: false, error: `Failed to rename ${'type'}` }, { status: 500, headers });
    }
}


// DELETE-метод для удаления файла
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'File key is required' }, { status: 400, headers });
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);

    return NextResponse.json({ success: true, message: 'File deleted successfully' }, { headers });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500, headers });
  }
}
