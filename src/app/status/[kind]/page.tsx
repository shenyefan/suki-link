import { Clock3, ExternalLink, SearchX } from 'lucide-react'
import Link from 'next/link'

import { LinkStatusView } from '@/components/link-status-view'
import { Button } from '@/components/ui/button'

const statusCopy = {
  'not-found': {
    title: '短链不存在',
    description: '这个短链可能已经被删除或输入有误',
    icon: SearchX,
  },
  expired: {
    title: '短链已过期',
    description: '这个短链已经超过有效期',
    icon: Clock3,
  },
  confirm: {
    title: '确认跳转',
    description: '请确认目标地址可信后再继续访问',
    icon: ExternalLink,
  },
} as const

type StatusKind = keyof typeof statusCopy

function isStatusKind(kind: string): kind is StatusKind {
  return kind in statusCopy
}

export default async function LinkStatusPage({
  searchParams,
  params,
}: {
  params: Promise<{ kind: string }>
  searchParams: Promise<{ target?: string; slug?: string }>
}) {
  const { kind } = await params
  const { target } = await searchParams
  const copy = isStatusKind(kind) ? statusCopy[kind] : statusCopy['not-found']

  const isConfirm = kind === 'confirm' && target

  return (
    <LinkStatusView
      title={copy.title}
      description={copy.description}
      icon={copy.icon}
    >
      {isConfirm && (
        <div className="mt-8 space-y-4">
          <p className="break-all rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {target}
          </p>
          <Button asChild>
            <Link href={target}>
              继续访问
            </Link>
          </Button>
        </div>
      )}
    </LinkStatusView>
  )
}
