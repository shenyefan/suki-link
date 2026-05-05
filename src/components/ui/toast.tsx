'use client'

import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  type: ToastType
  title: string
  description?: string
}

type ToastInput = Omit<ToastItem, 'id'>

const ToastContext = React.createContext<((toast: ToastInput) => void) | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const push = React.useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems(prev => [...prev, { ...toast, id }])
    window.setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id))
    }, 3600)
  }, [])

  const remove = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((item) => {
          const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? XCircle : Info
          return (
            <div
              key={item.id}
              className={cn(
                'grid grid-cols-[1rem_1fr_auto] items-start gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg',
                item.type === 'error' && 'border-destructive/40',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4',
                  item.type === 'success' && 'text-emerald-500',
                  item.type === 'error' && 'text-destructive',
                  item.type === 'info' && 'text-muted-foreground',
                )}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                className="-mr-1 -mt-1"
                onClick={() => remove(item.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">关闭提示</span>
              </Button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const push = React.useContext(ToastContext)
  if (!push)
    throw new Error('useToast must be used inside ToastProvider')
  return React.useMemo(() => ({
    success: (title: string, description?: string) => push({ type: 'success', title, description }),
    error: (title: string, description?: string) => push({ type: 'error', title, description }),
    info: (title: string, description?: string) => push({ type: 'info', title, description }),
  }), [push])
}
