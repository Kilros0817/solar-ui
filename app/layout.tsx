import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import TBProvider from './provider'
import { LayoutWrapper } from './components/LayoutWrapper'

export const metadata: Metadata = {
  title: 'Contract Collaboration Platform UI',
  description: 'Contract Collaboration Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TBProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster position="top-right" />
        </TBProvider>
      </body>
    </html>
  )
}

