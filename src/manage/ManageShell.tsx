'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  BarChart3,
  ChevronRight,
  DatabaseBackup,
  Languages,
  Link2,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Settings2,
  Sun,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { clearAdminToken, getAdminToken } from '@/manage/api'

type HeaderActionsContextValue = {
  setActions: (actions: ReactNode) => void
}

const HeaderActionsContext = createContext<HeaderActionsContextValue | null>(null)

export function useManageHeaderActions(actions: ReactNode) {
  const context = useContext(HeaderActionsContext)

  useEffect(() => {
    if (!context) return
    context.setActions(actions)
    return () => context.setActions(null)
  }, [actions, context])
}

const platformItems = [
  { href: '/manage/links', label: '短链', icon: Link2 },
  { href: '/manage/monitoring', label: '监控', icon: BarChart3 },
]

const settingItems = [
  { href: '/manage/migrate', label: '迁移', icon: DatabaseBackup },
]

function ThemeMenu({ onThemeChange }: { onThemeChange: (theme: 'light' | 'dark') => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onThemeChange('light')}>
          <Sun className="size-4" />
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange('dark')}>
          <Moon className="size-4" />
          深色
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string
  items: typeof platformItems
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="grid gap-1">
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{title}</div>
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  onThemeChange,
}: {
  pathname: string
  onNavigate?: () => void
  onLogout: () => void
  onThemeChange: (theme: 'light' | 'dark') => void
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-3">
        <Link href="/manage/links" onClick={onNavigate} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src="/sink.png" alt="Suki-Link" />
            <AvatarFallback className="rounded-md">SL</AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">Suki-Link</div>
            <div className="truncate text-xs text-muted-foreground">Link Management</div>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="grid gap-4 py-2">
          <NavSection title="平台" items={platformItems} pathname={pathname} onNavigate={onNavigate} />
          <NavSection title="设置" items={settingItems} pathname={pathname} onNavigate={onNavigate} />
        </div>
      </ScrollArea>

      <div className="grid gap-1 border-t p-3">
        <div className="flex items-center justify-between rounded-md px-2 py-1.5">
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" />
            <span className="text-sm">偏好</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" disabled>
              <Languages className="size-4" />
              <span className="sr-only">语言</span>
            </Button>
            <ThemeMenu onThemeChange={onThemeChange} />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 justify-start gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback>SU</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left leading-tight">
                <div className="truncate text-sm font-medium">Suki</div>
                <div className="truncate text-xs text-muted-foreground">管理员</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuLabel>Suki-Link</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="size-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function titleFromPath(pathname: string) {
  if (pathname.startsWith('/manage/monitoring')) return '监控'
  if (pathname.startsWith('/manage/migrate')) return '迁移'
  return '短链'
}

export function ManageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [actions, setActions] = useState<ReactNode>(null)
  const headerContext = useMemo(() => ({ setActions }), [])

  useEffect(() => {
    if (pathname === '/manage/login') return
    if (!getAdminToken()) router.replace('/manage/login')
  }, [pathname, router])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (pathname === '/manage/login') return <>{children}</>

  const handleLogout = () => {
    clearAdminToken()
    router.replace('/manage/login')
  }

  return (
    <HeaderActionsContext.Provider value={headerContext}>
      <div className="flex h-svh bg-sidebar">
        <aside className="hidden w-64 shrink-0 md:block">
          <SidebarContent
            pathname={pathname}
            onLogout={handleLogout}
            onThemeChange={setTheme}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background md:m-2 md:rounded-xl md:border md:shadow-sm">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 md:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                  onThemeChange={setTheme}
                />
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" className="hidden size-8 md:inline-flex">
              <PanelLeft className="size-4" />
              <span className="sr-only">侧边栏</span>
            </Button>
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="text-muted-foreground">Dashboard</span>
              <ChevronRight className="size-4 text-muted-foreground" />
              <span className="truncate font-medium">{titleFromPath(pathname)}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </HeaderActionsContext.Provider>
  )
}
