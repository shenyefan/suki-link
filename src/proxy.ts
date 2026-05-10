import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getHomeUrl, getRedirectStatusCode } from '@/server/env'

export function proxy(request: NextRequest): NextResponse {
  const home = getHomeUrl()
  const pathname = request.nextUrl.pathname
  const isHomePath = pathname === '/' || pathname === '' || pathname === '/index'
  if (home && isHomePath) {
    const target = new URL(home, request.url)
    return NextResponse.redirect(target, getRedirectStatusCode())
  }
  if (!home && isHomePath)
    return NextResponse.redirect(new URL('/dashboard', request.url), 302)
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/index'],
}
