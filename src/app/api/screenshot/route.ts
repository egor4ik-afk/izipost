import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    // 1. Проверяем авторизацию (чтобы чужие не дергали наш API)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // 2. Вычисляем папку пользователя и имя файла
    const basePath = session.user.isSuperAdmin ? "" : `users/${session.user.email}/`;
    const fileName = `screenshot-${Date.now()}.jpg`; // Сразу ставим .jpg
    const s3Key = `${basePath}${fileName}`; // Полный путь для сохранения в S3

    // 3. Отправляем задачу твоему скриншотеру на Vercel
    const vercelApiUrl = process.env.VERCEL_SCREENSHOT_API || 'https://relaxcms.vercel.app/api/screenshot';

    const response = await fetch(vercelApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: url,
        s3Key: s3Key // 👈 Передаем точный путь для сохранения
      }),
    });

    const data = await response.json();

    // Проверяем, успешно ли отработал Vercel
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Ошибка на стороне Vercel скриншотера');
    }

    // 4. Возвращаем успешный ответ обратно на клиент
    return NextResponse.json({ success: true, url: data.url });

  } catch (error: any) {
    console.error('Ошибка проксирования скриншота:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to create screenshot via Vercel' 
    }, { status: 500 });
  }
}