import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { Geist, Geist_Mono } from "next/font/google";
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
})
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
})
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
})

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
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${bebasNeue.variable} antialiased`}
        >
          <div className="noise-overlay" aria-hidden="true" />
          <PostHogProvider>
            {children}
            <CookieConsent />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
