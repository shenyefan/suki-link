import { Clock3, SearchX } from 'lucide-react'

import { LinkStatusView } from '@/components/link-status-view'

const statusCopy = {
  'not-found': {
    title: '短链不存在',
    description: '这个短链不存在，可能已经被删除，或链接输入有误。',
    icon: SearchX,
  },
  expired: {
    title: '短链已过期',
    description: '这个短链已经超过有效期，无法继续访问。',
    icon: Clock3,
  },
} as const

type StatusKind = keyof typeof statusCopy

function isStatusKind(kind: string): kind is StatusKind {
  return kind in statusCopy
}

export default async function LinkStatusPage({
  params,
}: {
  params: Promise<{ kind: string }>
}) {
  const { kind } = await params
  const copy = isStatusKind(kind) ? statusCopy[kind] : statusCopy['not-found']

  return (
    <LinkStatusView
      title={copy.title}
      description={copy.description}
      icon={copy.icon}
    />
  )
}
