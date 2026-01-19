import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
    const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    const browser = await puppeteer.launch({
      args: isLocal ? [] : [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: isLocal 
        ? localExecutablePath 
        : await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
          ),
      headless: true,
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    // УСКОРЕНИЕ: networkidle2 быстрее, чем networkidle0
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    // КАЧЕСТВО: 95 (было 80)
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });

    await browser.close();

    // НОВОЕ ИМЯ: dragonbarber.ru.jpg
    let cleanName = '';
    try {
        const urlObj = new URL(url);
        cleanName = urlObj.hostname.replace('www.', ''); // убираем www
    } catch (e) {
        // Если URL кривой, просто чистим строку
        cleanName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '');
    }

    // Если хотите сохранять путь (например dragonbarber.ru-about.jpg), раскомментируйте ниже:
    // const pathName = new URL(url).pathname.replace(/\//g, '-');
    // if (pathName && pathName !== '-') cleanName += pathName;

    const fileName = `preview/${cleanName}.jpg`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: screenshotBuffer,
      ContentType: 'image/jpeg',
      // CacheControl: 'no-cache', // Можно добавить, чтобы браузер не кэшировал старую картинку
    }));

    // Добавляем timestamp в URL только для отображения (чтобы сбросить кэш браузера), 
    // но сам файл в хранилище будет перезаписан под тем же именем.
    const fileUrl = `https://storage.yandexcloud.net/${BUCKET}/${fileName}?t=${Date.now()}`;

    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: error.message || 'Failed to take screenshot' }, { status: 500 });
  }
}