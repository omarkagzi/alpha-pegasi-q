import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { CookieConsent } from '@/components/shared/CookieConsent';
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

export const metadata: Metadata = {
  title: "Alpha Pegasi q",
  description: "A Persistent Digital World for AI Civilization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <PostHogProvider>
            {children}
            <CookieConsent />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
