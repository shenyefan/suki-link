'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { clearAdminToken, getAdminToken } from '@/lib/dashboard-api'

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return undefined
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/dashboard/login') return
    if (!getAdminToken()) router.replace('/dashboard/login')
  }, [pathname, router])

  if (pathname === '/dashboard/login') return <>{children}</>

  const handleLogout = () => {
    clearAdminToken()
    router.replace('/dashboard/login')
  }

  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar onLogout={handleLogout} />
      <SidebarInset
        className={cn(
          '@container/content',
          'has-data-[layout=fixed]:h-svh',
          'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]',
        )}
      >
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
