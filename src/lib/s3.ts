import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// 1. Инициализация клиента
const s3Client = new S3Client({
  region: process.env.YANDEX_REGION,
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY as string,
  },
});

export const BUCKET_NAME = process.env.YANDEX_BUCKET_NAME;

// 2. Функция для получения списка файлов
export async function getBucketFiles() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const data = await s3Client.send(command);
    
    // Если файлов нет, вернем пустой массив
    if (!data.Contents) return [];

    // Преобразуем данные в удобный вид + ссылка на картинку
    return data.Contents.map((file) => ({
      key: file.Key,
      lastModified: file.LastModified,
      size: file.Size,
      url: `https://storage.yandexcloud.net/${BUCKET_NAME}/${file.Key}`
    }));

  } catch (error) {
    console.error("Ошибка при чтении из S3:", error);
    return [];
  }
}
