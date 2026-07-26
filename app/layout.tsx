import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'Agri-Voice | AI-Powered Smart Farming Dashboard',
  description:
    'AI-powered farming dashboard with voice assistant, disease scanner, mandi prices, weather alerts, and farmer community features.',
  keywords: ['Agri-Voice', 'smart farming', 'agriculture AI', 'mandi rates', 'crop disease scan', 'voice assistant'],
  authors: [{ name: 'Sunny Kumar Dev', url: 'https://github.com/sunnydev07' }],
  openGraph: {
    title: 'Agri-Voice | Smart Farming Platform',
    description: 'Multilingual voice AI assistant, crop disease scanner, and real-time mandi prices for modern farmers.',
    siteName: 'Agri-Voice',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agri-Voice | AI Smart Farming',
    description: 'Multilingual voice AI assistant, crop disease scanner, and real-time mandi rates.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a1a0f',
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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        {children}
      </body>
    </html>
  )
}
