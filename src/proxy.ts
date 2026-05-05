import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getHomeUrl, getRedirectStatusCode } from '@/server/env'

/**
 * Next.js 16+ 使用 `proxy`（见 EO 文档说明）；等价于历史上的 middleware。
 * - Next / Pages：https://pages.edgeone.ai/zh/document/framework-nextjs
 * - 平台级规则请优先查 `edgeone.json`（Next.js redirects 在 Pages 上支持有限）。
 */
export function proxy(request: NextRequest): NextResponse {
  const home = getHomeUrl()
  const pathname = request.nextUrl.pathname
  if (home && (pathname === '/' || pathname === '')) {
    const target = new URL(home, request.url)
    return NextResponse.redirect(target, getRedirectStatusCode())
  }
  if (!home && (pathname === '/' || pathname === ''))
    return NextResponse.redirect(new URL('/manage', request.url), 302)
  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
