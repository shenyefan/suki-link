'use client'

import * as React from 'react'
import Image from 'next/image'
import { Check, Laptop, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type Theme = 'light' | 'dark' | 'system'

type SidebarBrandProps = {
  brand: {
    name: string
    logo: string
    logoDark: string
    description: string
  }
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function SidebarBrand({ brand }: SidebarBrandProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return (window.localStorage.getItem('suki-theme') as Theme | null) ?? 'system'
  })

  React.useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem('suki-theme', theme)

    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 items-center gap-2 px-2 text-start text-sm leading-tight">
          <div className="flex aspect-square size-8 items-center justify-center">
            <Image src={brand.logo} alt="" width={22} height={22} className="size-5 object-contain dark:hidden" priority />
            <Image src={brand.logoDark} alt="" width={22} height={22} className="hidden size-5 object-contain dark:block" priority />
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-semibold">{brand.name}</span>
            <span className="truncate text-xs">{brand.description}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ms-auto size-8"
              >
                {theme === 'light' ? <Sun className="size-4" /> : theme === 'dark' ? <Moon className="size-4" /> : <Laptop className="size-4" />}
                <span className="sr-only">切换主题</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-40 rounded-lg"
              align="end"
              side="right"
              sideOffset={4}
            >
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="size-4" />
                浅色
                <Check className={cn('ms-auto size-4', theme !== 'light' && 'hidden')} />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="size-4" />
                深色
                <Check className={cn('ms-auto size-4', theme !== 'dark' && 'hidden')} />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Laptop className="size-4" />
                跟随系统
                <Check className={cn('ms-auto size-4', theme !== 'system' && 'hidden')} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
