import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getHomeUrl, getRedirectStatusCode } from '@/server/env'

export function proxy(request: NextRequest): NextResponse {
  const home = getHomeUrl()
  const pathname = request.nextUrl.pathname
  if (home && (pathname === '/' || pathname === '')) {
    const target = new URL(home, request.url)
    return NextResponse.redirect(target, getRedirectStatusCode())
  }
  if (!home && (pathname === '/' || pathname === ''))
    return NextResponse.redirect(new URL('/dashboard', request.url), 302)
  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
