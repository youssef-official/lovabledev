import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiKeysProvider } from "@/contexts/ApiKeysContext";

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Lovable - Build something Lovable",
  description: "Create apps and websites by chatting with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ApiKeysProvider>
            {children}
          </ApiKeysProvider>
        </AuthProvider>
      </body>
    </html>
  );
}