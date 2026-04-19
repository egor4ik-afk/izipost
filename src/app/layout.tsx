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
  metadataBase: new URL("https://izipost.ru"),
  title: {
    default: "IziPost — Файловое хранилище",
    template: "%s | IziPost",
  },
  description: "IziPost — удобное файловое хранилище для управления медиафайлами, изображениями и документами. Быстрая загрузка, CDN, организация по папкам.",
  keywords: ["файловое хранилище", "загрузка файлов", "CDN", "медиафайлы", "хранилище изображений"],
  authors: [{ name: "RelaxDev", url: "https://relaxdev.ru" }],
  creator: "RelaxDev",
  manifest: "/manifest.json",
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
    title: "IziPost — Файловое хранилище",
    description: "Удобное файловое хранилище для управления медиафайлами и документами.",
    images: [{ url: "/web-app-manifest-512x512.png", width: 512, height: 512, alt: "IziPost" }],
  },
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
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}