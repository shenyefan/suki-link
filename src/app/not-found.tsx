import { SearchX } from 'lucide-react'

import { LinkStatusView } from '@/components/link-status-view'

export default function NotFound() {
  return (
    <LinkStatusView
      title="页面不存在"
      description="你访问的页面不存在，可能已经被移动、删除，或链接输入有误。"
      icon={SearchX}
    />
  )
}
