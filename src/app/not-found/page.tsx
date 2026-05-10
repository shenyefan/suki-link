import { SearchX } from 'lucide-react'

import { LinkStatusView } from '@/components/link-status-view'

export default function LinkNotFoundPage() {
  return (
    <LinkStatusView
      title="短链不存在"
      description="这个短链可能已经被删除或输入有误"
      icon={SearchX}
    />
  )
}
