import type { Metadata, Viewport } from "next";
import "./globals.css";

// ❌ Убрали next/font/google — Google Fonts недоступны при билде в РФ
// Используем системные шрифты через CSS

export const viewport: Viewport = {
  themeColor: "#010417",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://izipost.ru"),
  title: {
    default: "IziPost — Файловое хранилище с CDN",
    template: "%s | IziPost",
  },
  description: "IziPost — файловое хранилище с CDN для проектов. Загружайте файлы до 5 ГБ, получайте CDN-ссылки автоматически. Часть платформы RelaxDev.",
  keywords: ["файловое хранилище", "загрузка файлов", "CDN", "медиафайлы", "S3"],
  authors: [{ name: "RelaxDev", url: "https://relaxdev.ru" }],
  creator: "RelaxDev",
  verification: {
    yandex: '3a209b6e72828f74',
    google: 'cee020f869c68a59',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IziPost",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://izipost.ru",
    siteName: "IziPost",
    title: "IziPost — Файловое хранилище с CDN",
    description: "Файловое хранилище с CDN для проектов. Часть платформы RelaxDev.",
    images: [{ url: "/og-image.jpg", width: 512, height: 512, alt: "IziPost" }],
  },
  twitter: {
    card: "summary",
    title: "IziPost — Файловое хранилище с CDN",
    description: "Файловое хранилище с CDN для проектов.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased font-sans">
      </body>
    </html>
  );
}