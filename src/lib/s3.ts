
// src/lib/s3.ts
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.YANDEX_REGION as string,
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET = process.env.YANDEX_BUCKET_NAME as string;

// Получить содержимое конкретной "папки"
export async function getFilesByFolder(prefix = "") {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix, // Какую папку смотрим
      Delimiter: "/", // Важно: это заставляет S3 группировать подпапки
    });

    const data = await s3Client.send(command);

    // 1. Папки (CommonPrefixes)
    const folders = (data.CommonPrefixes || [])
      .filter(p => p.Prefix) // Make sure Prefix is not undefined
      .map((p) => ({
        name: p.Prefix!.replace(prefix, "").replace("/", ""), // Убираем лишние слэши для отображения
        path: p.Prefix!, // Полный путь для API
        type: "folder" as const
      }));

    // 2. Файлы (Contents)
    const files = (data.Contents || [])
      .filter((f) => f.Key && f.Key !== prefix) // Убираем саму папку-плейсхолдер, если есть
      .map((f) => ({
        name: f.Key!.replace(prefix, ""),
        path: f.Key!,
        type: "file" as const,
        url: `https://storage.yandexcloud.net/${BUCKET}/${f.Key!}`,
        lastModified: f.LastModified,
      }));

    return [...folders, ...files];
  } catch (error) {
    console.error("S3 Error:", error);
    return [];
  }
}

// Загрузка файла
export async function uploadFileToS3(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

// Удаление файла
export async function deleteFileFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}
