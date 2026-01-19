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

export const maxDuration = 30; // Уменьшаем таймаут, так как должно работать быстро
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
      args: isLocal ? [] : [
          ...chromium.args, 
          '--hide-scrollbars', 
          '--disable-web-security',
          '--disable-gpu', // Отключаем GPU для скорости
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Экономия памяти
      ],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: isLocal 
        ? localExecutablePath 
        : await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
          ),
      headless: true,
    });

    const page = await browser.newPage();
    
    // Блокируем загрузку тяжелых ресурсов, которые не нужны для скриншота (видео, шрифты, если не критично)
    // Это значительно ускоряет загрузку страницы
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'script', 'font'].includes(resourceType)) {
            req.continue();
        } else if (['media', 'websocket', 'manifest', 'other'].includes(resourceType)) {
            // Блокируем видео и сокеты
            req.abort();
        } else {
            req.continue();
        }
    });

    // User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    // --- ГЛАВНОЕ УСКОРЕНИЕ ---
    // 'load' срабатывает, когда загрузился HTML + картинки + CSS. 
    // Это быстрее, чем ждать 'networkidle2' (остановка сети).
    try {
        await page.goto(url, { waitUntil: 'load', timeout: 12000 });
    } catch (e) {
        // Если сайт грузится дольше 12 сек - всё равно пытаемся сделать скриншот того, что успело загрузиться
        console.log('Timeout hit, taking screenshot anyway...');
    }

    // Качество 75 - золотая середина (быстро жмется, мало весит, выглядит норм для превью)
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 90 });

    await browser.close();

    // Формируем имя: domain.ru.jpg
    let cleanName = '';
    try {
        const urlObj = new URL(url);
        cleanName = urlObj.hostname.replace('www.', '');
    } catch (e) {
        cleanName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '');
    }
    
    const fileName = `preview/${cleanName}.jpg`;

    // Загрузка
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: screenshotBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=0, no-cache, no-store, must-revalidate', // Запрещаем кэш S3
    }));

    // Добавляем timestamp, чтобы вы сразу увидели новую картинку
    const fileUrl = `https://storage.yandexcloud.net/${BUCKET}/${fileName}?t=${Date.now()}`;

    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}