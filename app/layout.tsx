import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter, Roboto_Mono } from 'next/font/google'
import Header from '@/components/header'
import FaqSection from '@/components/faq-section'
import Footer from '@/components/footer'
import AdblockWarning from '@/components/adblock-warning'
import AnalyticsProvider from '@/components/analytics-provider'
import { SITE_URL } from '@/lib/seo'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'YouTube Video Converter – Download MP3 & MP4 Online',
    template: '%s',
  },
  description: 'Convert YouTube videos to MP3 or MP4 online. Personal use only. Users are responsible for complying with local copyright laws.',
  openGraph: {
    type: 'website',
    locale: 'en',
    siteName: 'YouTube Video Converter',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={`font-sans antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <Header />
        <main className="flex-1">
          {children}
          <FaqSection />
        </main>
        <Footer />
        <AdblockWarning />
        <AnalyticsProvider />
        {process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
