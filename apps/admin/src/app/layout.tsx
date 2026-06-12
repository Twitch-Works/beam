import type { Metadata } from 'next'
import './globals.css'

/**
 * Beam Admin — root layout
 *
 * Rules enforced here:
 * - lang="en" for accessibility + screen readers
 * - No emojis in title/description (assistive tech reads them aloud)
 * - robots noindex/nofollow — admin is internal only
 * - charset utf-8 declared via Next.js metadata (injected automatically)
 */
export const metadata: Metadata = {
  title: 'Beam Admin — Operations Dashboard',
  description: 'Beam internal operations and analytics dashboard. Restricted access.',
  robots: 'noindex, nofollow',
  // No emojis in any metadata field — they render inconsistently across email
  // clients, browser tabs, and screen readers.
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-IN">
      <head>
        {/* Strict: no emoji in <title>. Verified above via metadata export. */}
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
