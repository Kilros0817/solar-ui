import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from './contexts/UserContext'
import { Toaster } from 'sonner'

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
        <UserProvider>
          {children}
          <Toaster position="top-right" />
        </UserProvider>
      </body>
    </html>
  )
}

