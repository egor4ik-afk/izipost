import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // Имя файла по пользователю
    const basePath = session.user.isSuperAdmin ? "" : `users/${session.user.email}/`;
    const fileName = `screenshot-${Date.now()}`;
    const s3Key = `${basePath}${fileName}`;

    // Наш сервис вместо Vercel
    const response = await fetch(
      `${process.env.SCREENSHOT_SERVICE_URL}/screenshot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Secret': process.env.SCREENSHOT_API_SECRET || '',
        },
        body: JSON.stringify({ url, projectId: s3Key }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.detail || 'Ошибка скриншотера');
    }

    return NextResponse.json({ success: true, url: data.public_url });
  } catch (error: any) {
    console.error('Ошибка скриншота:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create screenshot' },
      { status: 500 }
    );
  }
}
