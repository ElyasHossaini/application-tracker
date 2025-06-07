import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryProvider } from '@/components/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Auto Application - AI Job Application Assistant',
  description: 'Automate your job application process with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
