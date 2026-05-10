'use client'

import { LogOut } from 'lucide-react'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type SidebarLogoutProps = {
  onLogout: () => void
}

export function SidebarLogout({ onLogout }: SidebarLogoutProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="default"
          tooltip="退出登录"
          onClick={onLogout}
        >
          <LogOut />
          <span>退出登录</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
