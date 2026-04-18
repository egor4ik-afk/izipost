import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#010417",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "IziPost — Файловое хранилище",
    template: "%s | IziPost",
  },
  description: "IziPost — удобное файловое хранилище для управления медиафайлами, изображениями и документами. Быстрая загрузка, CDN, организация по папкам.",
  keywords: ["файловое хранилище", "загрузка файлов", "CDN", "медиафайлы", "хранилище изображений"],
  authors: [{ name: "RelaxDev", url: "https://relaxdev.ru" }],
  creator: "RelaxDev",

  // PWA
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IziPost",
  },

  // OpenGraph
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://izipost.ru",
    siteName: "IziPost",
    title: "IziPost — Файловое хранилище",
    description: "Удобное файловое хранилище для управления медиафайлами и документами.",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "IziPost",
      },
    ],
  },

  // Twitter/X
  twitter: {
    card: "summary",
    title: "IziPost — Файловое хранилище",
    description: "Удобное файловое хранилище для управления медиафайлами.",
    images: ["/web-app-manifest-512x512.png"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/web-app-manifest-192x192.png",
  },

  robots: {
    index: false, // хранилище — закрытый сервис, не индексируем
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Кнопки навигации назад/вперёд для ноутбука */}
        <div className="hidden lg:flex fixed bottom-6 left-6 z-50 gap-2">
          <button
            onClick={() => window.history.back()}
            aria-label="Назад"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 text-slate-600 dark:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <button
            onClick={() => window.history.forward()}
            aria-label="Вперёд"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 text-slate-600 dark:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
        {children}
      </body>
    </html>
  );
}