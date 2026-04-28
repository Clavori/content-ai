import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentAI — Gerador de Conteúdo com IA",
  description: "Crie conteúdo incrível para blogs, redes sociais, e-mails e mais usando Inteligência Artificial. Rápido, grátis e sem cadastro.",
  keywords: ["gerador de conteúdo", "IA", "inteligência artificial", "marketing de conteúdo", "blog", "instagram", "e-mail marketing", "copywriting"],
  authors: [{ name: "ContentAI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ContentAI — Gerador de Conteúdo com IA",
    description: "Crie conteúdo incrível para blogs, redes sociais, e-mails e mais usando IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentAI — Gerador de Conteúdo com IA",
    description: "Crie conteúdo incrível para blogs, redes sociais, e-mails e mais usando IA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
