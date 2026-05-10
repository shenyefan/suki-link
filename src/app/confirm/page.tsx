import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { LinkStatusView } from '@/components/link-status-view'
import { Button } from '@/components/ui/button'

export default async function LinkConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>
}) {
  const { target } = await searchParams

  return (
    <LinkStatusView
      title="确认跳转"
      description="请确认目标地址可信后再继续访问"
      icon={ExternalLink}
    >
      {target && (
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
