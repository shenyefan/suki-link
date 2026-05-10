import { BarChart3, DatabaseBackup, Link2 } from 'lucide-react'

import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  brand: {
    name: 'Suki-Link',
    logo: Link2,
    description: 'Link Management',
  },
  navGroups: [
    {
      title: '平台',
      items: [
        {
          title: '短链',
          url: '/dashboard/links',
          icon: Link2,
        },
        {
          title: '监控',
          url: '/dashboard/monitoring',
          icon: BarChart3,
        },
      ],
    },
    {
      title: '设置',
      items: [
        {
          title: '迁移',
          url: '/dashboard/migrate',
          icon: DatabaseBackup,
        },
      ],
    },
  ],
}
