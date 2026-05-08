'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  Link2,
  LogOut,
  Menu,
  Moon,
  Sun,
  TriangleAlert,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { apiJson, clearAdminToken, getAdminToken } from '@/manage/api'

const navItems = [
  { href: '/manage/links', label: '短链', icon: Link2 },
  { href: '/manage/monitoring', label: '监控', icon: BarChart3 },
]

type SystemStatus = {
  kv: {
    mode: 'native' | 'bridge' | 'memory' | 'test'
    binding?: string
    expectedBindings: string[]
    bindingProbe: Record<string, boolean>
  }
}

function ThemeToggle({ onThemeChange }: { onThemeChange: (theme: 'light' | 'dark') => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          深色
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MemoryKvNotice() {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-200">
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle className="text-xs">内存模式</AlertTitle>
      <AlertDescription className="text-xs text-amber-900/90 dark:text-amber-100/90">
        未检测到 EdgeOne KV 绑定，数据重启后会丢失。请将 KV 变量名绑定为 Link。
      </AlertDescription>
    </Alert>
  )
}

export function ManageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isMemoryKv, setIsMemoryKv] = useState(false)

  useEffect(() => {
    if (pathname === '/manage/login') return
    if (!getAdminToken()) router.replace('/manage/login')
  }, [pathname, router])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (pathname === '/manage/login' || !getAdminToken()) return
    let cancelled = false
    apiJson<SystemStatus>('/api/system/status')
      .then((status) => {
        if (!cancelled)
          setIsMemoryKv(status.kv.mode === 'memory')
      })
      .catch(() => {
        if (!cancelled)
          setIsMemoryKv(false)
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  if (pathname === '/manage/login') return <>{children}</>

  const handleLogout = () => {
    clearAdminToken()
    router.replace('/manage/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/manage/links" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/sink.png" alt="Suki-Link" />
              <AvatarFallback>SL</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">Suki-Link</span>
          </Link>
          <ThemeToggle onThemeChange={setTheme} />
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-border p-4">
          {isMemoryKv && (
            <div className="mb-3">
              <MemoryKvNotice />
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b border-border px-4">
                <Link href="/manage/links" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/sink.png" alt="Suki-Link" />
                    <AvatarFallback>SL</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold">Suki-Link</span>
                </Link>
              </div>
              <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </ScrollArea>
              <div className="border-t border-border p-4">
                {isMemoryKv && (
                  <div className="mb-3">
                    <MemoryKvNotice />
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => {
                    setOpen(false)
                    handleLogout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/sink.png" alt="Suki-Link" />
              <AvatarFallback>SL</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">Suki-Link</span>
          </div>
          <div className="flex-1" />
          <ThemeToggle onThemeChange={setTheme} />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-6xl p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
