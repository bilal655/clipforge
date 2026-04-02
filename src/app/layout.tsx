import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClipForge — Auto-clip your streams',
  description: 'AI-powered VOD clipping, captions, and social posting for streamers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
