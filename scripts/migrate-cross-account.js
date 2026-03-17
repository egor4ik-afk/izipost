require("dotenv").config();

const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const SOURCE_BUCKET = process.env.SOURCE_BUCKET;
const DEST_BUCKET = process.env.DEST_BUCKET;
const REGION = process.env.YANDEX_REGION || "ru-central1";

const sourceS3 = new S3Client({
  region: REGION,
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.SOURCE_ACCESS_KEY,
    secretAccessKey: process.env.SOURCE_SECRET_KEY,
  },
  forcePathStyle: true,
});

const destS3 = new S3Client({
  region: REGION,
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.DEST_ACCESS_KEY,
    secretAccessKey: process.env.DEST_SECRET_KEY,
  },
  forcePathStyle: true,
});

const DRY_RUN = false;

// Разрешённые расширения
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function isImage(key) {
  return IMAGE_EXTENSIONS.some((ext) =>
    key.toLowerCase().endsWith(ext)
  );
}

async function migrate() {
  console.log("🚀 Starting IMAGE migration (photos only)");

  let continuationToken;
  let total = 0;
  let skipped = 0;

  do {
    const list = await sourceS3.send(
      new ListObjectsV2Command({
        Bucket: SOURCE_BUCKET,
        ContinuationToken: continuationToken,
      })
    );

    const objects = list.Contents || [];

    for (const obj of objects) {
      if (!obj.Key) continue;

      const key = obj.Key;

      // Пропускаем папки
      if (key.endsWith("/")) continue;

      // Пропускаем всё кроме фото
      if (!isImage(key)) {
        console.log(`⏭ Skipped (not image): ${key}`);
        skipped++;
        continue;
      }

      console.log(`📦 Migrating image: ${key}`);
      total++;

      const getObject = await sourceS3.send(
        new GetObjectCommand({
          Bucket: SOURCE_BUCKET,
          Key: key,
        })
      );

      if (!getObject.Body) continue;

      // Читаем в buffer (безопасно для файлов до 10МБ)
      const chunks = [];
      for await (const chunk of getObject.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      await destS3.send(
        new PutObjectCommand({
          Bucket: DEST_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: getObject.ContentType || "image/jpeg",
          ContentLength: buffer.length,
        })
      );

      if (!DRY_RUN) {
        await sourceS3.send(
          new DeleteObjectCommand({
            Bucket: SOURCE_BUCKET,
            Key: key,
          })
        );
      }
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  console.log("------------------------------------------------");
  console.log(`✅ Done`);
  console.log(`Migrated images: ${total}`);
  console.log(`Skipped files: ${skipped}`);
}

migrate().catch(console.error);
