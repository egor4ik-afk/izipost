import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Настраиваем S3 Клиент
const s3 = new S3Client({
  region: process.env.YANDEX_REGION,
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS_KEY_ID!,
    secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.YANDEX_BUCKET_NAME;

// Важные настройки для Vercel (таймаут 60 сек)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Определяем, где мы: локально или на Vercel
    const isLocal = process.env.NODE_ENV === 'development';
    
    // ПУТЬ ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ (Если будете тестить на Windows)
    // Если не нужно локально - можно оставить пустым или закомментировать
    const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    // Настройка Chromium для Vercel
    // Важно: загружаем файл шрифтов или пак, если нужно, но пока берем дефолт
    chromium.setGraphicsMode = false;

    const browser = await puppeteer.launch({
      args: isLocal ? [] : [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1280, height: 720 }, // Стандартный размер HD
      executablePath: isLocal 
        ? localExecutablePath 
        : await chromium.executablePath(), // Vercel сам найдет путь
      headless: isLocal ? true : chromium.headless,
    });

    const page = await browser.newPage();
    
    // Притворяемся обычным пользователем
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    // Переходим по ссылке и ждем загрузки сети (чтобы картинки прогрузились)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 });

    // Делаем скриншот (JPEG, качество 80, чтобы меньше весил)
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });

    await browser.close();

    // Генерируем имя файла: preview/домен-дата.jpg
    const cleanName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `preview/${cleanName}-${Date.now()}.jpg`;

    // Загружаем в Yandex Object Storage
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: screenshotBuffer,
      ContentType: 'image/jpeg',
    }));

    const fileUrl = `https://storage.yandexcloud.net/${BUCKET}/${fileName}`;

    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: error.message || 'Failed to take screenshot' }, { status: 500 });
  }
}
