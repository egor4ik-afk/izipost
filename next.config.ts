/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    bodySizeLimit: '10mb', // Ставим, например, 10 мегабайт
  },
  env: {
    YANDEX_ACCESS_KEY_ID: process.env.YANDEX_ACCESS_KEY_ID,
    YANDEX_SECRET_ACCESS_KEY: process.env.YANDEX_SECRET_ACCESS_KEY,
    YANDEX_BUCKET_NAME: process.env.YANDEX_BUCKET_NAME,
    YANDEX_REGION: process.env.YANDEX_REGION,
    API_SECRET_KEY: process.env.API_SECRET_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.yandexcloud.net',
        port: '',
        pathname: '/relaxdev/**',
      },
    ],
  },
};

module.exports = nextConfig;
