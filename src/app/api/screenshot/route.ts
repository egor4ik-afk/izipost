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
  let browser = null;
  
  try {
    const { url, containerId } = await req.json(); // 👈 Получаем containerId

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
          '--font-render-hinting=none',
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: isLocal 
        ? localExecutablePath 
        : await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
          ),
      headless: true,
    });

    const page = await browser.newPage();
    
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['media', 'font'].includes(resourceType)) { 
            req.continue(); 
        } else if (resourceType === 'image') {
             req.continue();
        } else {
             req.continue();
        }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
        console.log('Timeout waiting for networkidle, taking screenshot anyway...');
    }

    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(async () => {
        window.scrollBy(0, window.innerHeight);
        await new Promise(resolve => setTimeout(resolve, 200));
        window.scrollTo(0, 0);
    });

    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 85 });

    // 👇 Формируем путь используя containerId
    let fileName: string;
    if (containerId) {
      // Используем containerId для структуры preview/{containerId}/preview.jpg
      fileName = `preview/${containerId}/preview.jpg`;
    } else {
      // Fallback на старую логику (если containerId нет)
      let cleanName = '';
      try {
          const urlObj = new URL(url);
          cleanName = urlObj.hostname.replace('www.', '');
      } catch (e) {
          cleanName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '');
      }
      fileName = `preview/${cleanName}.jpg`;
    }

    // 👇 ВАЖНО: убираем no-cache из заголовков S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: screenshotBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000', // 👈 Разрешаем кэширование на 1 год
    }));

    const fileUrl = `https://storage.yandexcloud.net/${BUCKET}/${fileName}`;

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