import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
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
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://relaxdev.ru https://www.relaxdev.ru",
          },
        ],
      },
    ];
  },
};

export default nextConfig;