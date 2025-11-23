import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FaviconUpdater from '@/components/admin/FaviconUpdater'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IELTS Mock Test System',
  description: 'A comprehensive IELTS Mock Test platform for Radiance Education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FaviconUpdater />
        {children}
      </body>
    </html>
  )
}
