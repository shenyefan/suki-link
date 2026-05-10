import { Clock3 } from 'lucide-react'

import { LinkStatusView } from '@/components/link-status-view'

export default function LinkExpiredPage() {
  return (
    <LinkStatusView
      title="短链已过期"
      description="这个短链已经超过有效期"
      icon={Clock3}
    />
  )
}
