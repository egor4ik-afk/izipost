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

// Увеличиваем лимит, так как networkidle требует времени
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let browser = null;
  
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isLocal = process.env.NODE_ENV === 'development';
    const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    browser = await puppeteer.launch({
      args: isLocal ? [] : [
          ...chromium.args, 
          '--hide-scrollbars', 
          '--disable-web-security',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none', // Улучшает рендеринг шрифтов
      ],
      defaultViewport: { width: 1920, height: 1080 }, // FullHD дает больше контекста
      executablePath: isLocal 
        ? localExecutablePath 
        : await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
          ),
      headless: true,
    });

    const page = await browser.newPage();
    
    // Блокируем ТОЛЬКО тяжелые медиа. 
    // WebSocket и XHR/Fetch оставляем, иначе SPA сайты будут пустыми.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        // Блокируем только явный мусор для скриншота
        if (['media', 'font'].includes(resourceType)) { 
            // Шрифты иногда блокируют, но лучше оставить (или блочить, если скорость критична)
            // Если блокируешь шрифты, текст может исчезнуть. Я рекомендую НЕ блокировать шрифты для красоты.
            req.continue(); 
        } else if (resourceType === 'image') {
             req.continue();
        } else {
             req.continue();
        }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    // --- ИСПРАВЛЕНИЕ ПУСТОТЫ ---
    // 1. waitUntil: 'networkidle2' — ждет, пока загрузка данных почти прекратится (важно для React/Next.js сайтов)
    // 2. timeout: 15000 — даем 15 сек на загрузку, иначе делаем скрин того, что есть
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
        console.log('Timeout waiting for networkidle, taking screenshot anyway...');
    }

    // Дополнительная задержка 1с для анимаций появления (fade-in), которые часто используются
    await new Promise(r => setTimeout(r, 1000));

    // Скроллим страницу немного вниз, чтобы триггернуть lazy-load картинки (частая проблема пустоты)
    await page.evaluate(async () => {
        window.scrollBy(0, window.innerHeight);
        await new Promise(resolve => setTimeout(resolve, 200));
        window.scrollTo(0, 0);
    });

    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 85 });

    // Формируем имя
    let cleanName = '';
    try {
        const urlObj = new URL(url);
        cleanName = urlObj.hostname.replace('www.', '');
    } catch (e) {
        cleanName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '');
    }
    const fileName = `preview/${cleanName}.jpg`;

    // Загрузка в S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: screenshotBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
    }));

    const fileUrl = `https://storage.yandexcloud.net/${BUCKET}/${fileName}?t=${Date.now()}`;

    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  } finally {
      if (browser) {
          await browser.close();
      }
  }
}