// src/lib/s3.ts
import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  CopyObjectCommand,
  GetObjectCommand, // <--- Добавили этот импорт
  ListObjectsV2CommandOutput // <--- Добавили импорт типа ответа
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // <--- И этот тоже

const s3Client = new S3Client({
  region: process.env.YANDEX_REGION as string,
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET = process.env.YANDEX_BUCKET_NAME as string;

// Публичные ссылки — через CDN платформы, как в relaxdev (путь = ключ в бакете). При сбое
// Yandex тот же путь отдаёт https://files.relaxdev.ru
// Сборщик платформы подставляет в незаданные *_URL заглушку https://build-stub-domain.com,
// и она остаётся в .env рантайма — тогда ссылки вели в никуда. Заглушка = «не задано»
function envUrl(name: string, fallback: string): string {
  const v = (process.env[name] ?? "").trim();
  return !v || v.includes("build-stub-domain.com") || v === "auto-generated-stub-for-build" ? fallback : v;
}
const CDN_BASE = envUrl("CDN_BASE_URL", "https://cdn.relaxdev.ru").replace(/\/+$/, "");

/** Есть ли в папке хоть один объект */
export async function hasObjects(prefix: string): Promise<boolean> {
  try {
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 1 }));
    return (data.KeyCount ?? data.Contents?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export { s3Client as s3, BUCKET as bucketName };

// ... (остальные функции) ...

export async function getFilesByFolder(prefix = "") {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: "/", 
    });

    const data = await s3Client.send(command);

    const folders = (data.CommonPrefixes || [])
      .filter(p => p.Prefix)
      .map((p) => ({
        name: p.Prefix!.replace(prefix, "").replace("/", ""),
        path: p.Prefix!,
        type: "folder" as const
      }));

      const files = (data.Contents || [])
      .filter((f) => f.Key && f.Key !== prefix)
      .map((f) => ({
        name: f.Key!.replace(prefix, ""),
        path: f.Key!,
        type: "file" as const,
        url: `${CDN_BASE}/${f.Key!}`,
        size: f.Size, // <--- ВОТ ЭТА СТРОЧКА! Передаем размер в байтах
        lastModified: f.LastModified,
      }));

    return [...folders, ...files];
  } catch (error) {
    console.error("S3 Error:", error);
    return [];
  }
}
export async function getDownloadUrlFromS3(key: string, fileName: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    // Этот магический параметр заставит браузер СКАЧАТЬ файл с правильным именем
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  // Ссылка будет жить 1 час (3600 секунд), этого хватит чтобы начать скачивание
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
export async function uploadFileToS3(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

export async function deleteFileFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}

// === НОВЫЕ ФУНКЦИИ ===

export async function renameFileInS3(oldKey: string, newKey: string) {
  // 1. Копируем
  await s3Client.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: encodeURI(`${BUCKET}/${oldKey}`), // encodeURI полезен для кириллицы/пробелов
    Key: newKey
  }));

  // 2. Удаляем старый
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: oldKey
  }));
}

export async function renameFolderInS3(oldPrefix: string, newPrefix: string) {
  let continuationToken: string | undefined = undefined;
  
  // Проходим по всем файлам в папке (включая подпапки)
  do {
      const listCommand = new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: oldPrefix,
          ContinuationToken: continuationToken
      });
      
      // Явно указываем тип возвращаемого значения, чтобы TS видел NextContinuationToken
      const data: ListObjectsV2CommandOutput = await s3Client.send(listCommand);

      if (data.Contents && data.Contents.length > 0) {
          for (const file of data.Contents) {
              if (!file.Key) continue;
              
              // Заменяем старый префикс папки на новый в пути файла
              const newFileKey = file.Key.replace(oldPrefix, newPrefix);
              
              // Копируем
              await s3Client.send(new CopyObjectCommand({
                  Bucket: BUCKET,
                  CopySource: encodeURI(`${BUCKET}/${file.Key}`),
                  Key: newFileKey
              }));
              
              // Удаляем
              await s3Client.send(new DeleteObjectCommand({
                  Bucket: BUCKET,
                  Key: file.Key
              }));
          }
      }
      continuationToken = data.NextContinuationToken;
  } while (continuationToken);
}