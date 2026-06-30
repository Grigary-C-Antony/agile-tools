import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Agile Toolkit — Enterprise Suite',
    template: '%s | Agile Toolkit',
  },
  description: 'Smart tools for modern agile teams. Plan, estimate, prioritize and improve — all in one place.',
  keywords: ['agile', 'planning poker', 'WSJF', 'RICE', 'sprint planning', 'scrum', 'estimation'],
  authors: [{ name: 'Agile Toolkit' }],
  creator: 'Agile Toolkit',
}

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface antialiased overflow-x-hidden">
        {/* Fixed ambient glows */}
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 15% 20%, rgba(114, 60, 235, 0.08) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(220, 117, 14, 0.05) 0%, transparent 45%)'
          }} />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
