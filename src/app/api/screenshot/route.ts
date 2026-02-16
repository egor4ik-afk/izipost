import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { uploadFileToS3 } from '@/lib/s3';
import { auth } from '@/auth';

// Увеличиваем лимит времени выполнения для этого роута (скриншоты делаются не моментально)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    // 1. Проверяем авторизацию
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // 2. Настраиваем запуск браузера (Локально vs Продакшен)
    const isLocal = process.env.NODE_ENV === 'development';
    
    let executablePath: string;
    if (isLocal) {
      // ПУТЬ ДЛЯ ЛОКАЛЬНОГО ТЕСТА (Выбирает в зависимости от твоей ОС)
      executablePath = process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'linux'
        ? '/usr/bin/google-chrome'
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      // НА ПРОДАКШЕНЕ (Vercel/Yandex) используем sparticuz
      executablePath = await chromium.executablePath();
    }

    // 3. Запускаем браузер
    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    // 4. Делаем скриншот
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Переходим по ссылке и ждем, пока прогрузятся картинки и стили (networkidle2)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const screenshotBuffer = await page.screenshot({ type: 'png' });
    await browser.close();

    // 5. Формируем правильный путь для сохранения (в личную папку пользователя)
    const basePath = session.user.isSuperAdmin ? "" : `users/${session.user.email}/`;
    const fileName = `screenshot-${Date.now()}.png`;
    const s3Key = `${basePath}${fileName}`; // Сохраняем прямо в корень папки юзера

    // 6. Загружаем в Yandex/AWS S3
    await uploadFileToS3(Buffer.from(screenshotBuffer), s3Key, 'image/png');

    // 7. Возвращаем готовую ссылку
    const bucketName = process.env.YANDEX_BUCKET_NAME;
    const publicUrl = `https://${bucketName}.storage.yandexcloud.net/${s3Key}`;

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error('Ошибка скриншотера:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to create screenshot' 
    }, { status: 500 });
  }
}