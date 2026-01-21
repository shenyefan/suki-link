import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: "Suki Link",
  description: "一个基于 EO Pages + Next.js 的短链服务",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className="dark">
      <head>
        <link rel="icon" href="/logo.svg" />
      </head>
      <body className="bg-black text-white antialiased">
        <NextTopLoader
          color="#3b82f6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #3b82f6, 0 0 5px #3b82f6"
          zIndex={9999}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
