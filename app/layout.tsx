import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SkinProvider } from '@/components/SkinProvider'
import { LevelProvider } from '@/contexts/LevelContext'
import { FeedbackButton } from '@/components/FeedbackButton'
import { Analytics } from '@/components/Analytics'

export const metadata: Metadata = {
  title: 'Unirea',
  description: 'Unirea - Reteaua absolventilor',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body className="min-h-screen">
        <SkinProvider>
          <LevelProvider>
            {children}
            <FeedbackButton />
            <Analytics />
          </LevelProvider>
        </SkinProvider>
      </body>
    </html>
  )
}
