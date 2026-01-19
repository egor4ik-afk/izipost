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

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isLocal = process.env.NODE_ENV === 'development';
    
    // Путь для локального Chrome (Windows)
    const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    // Настройка графики (опционально для sparticuz)
    // chromium.setGraphicsMode = false; // Можно убрать, если вызывает ошибки типов

    const browser = await puppeteer.launch({
      args: isLocal ? [] : [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: isLocal 
        ? localExecutablePath 
        : await chromium.executablePath(),
      // ИСПРАВЛЕНИЕ: Вместо chromium.headless используем просто true
      headless: true, 
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    // Ждем, пока сеть освободится (значит картинки загрузились)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 });

    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });

    await browser.close();

    const cleanName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `preview/${cleanName}-${Date.now()}.jpg`;

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