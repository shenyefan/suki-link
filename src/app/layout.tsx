import type { Metadata } from 'next'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Suki-Link',
  description: 'EdgeOne Pages 短链与管理台（Next.js）',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ToastProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
