import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getRedirectStatusCode } from '@/server/env'
import {
  assertSlugAllowed,
  buildTargetUrl,
  getLink,
  normalizeSlug,
} from '@/server/link'
import { getSearchRecord } from '@/server/response'

async function statusPage(request: NextRequest, status: 404 | 410, kind: 'not-found' | 'expired'): Promise<Response> {
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  }
  if (request.method === 'HEAD')
    return new Response(null, { status, headers })

  const pageUrl = new URL(`/link-status/${kind}`, request.url)
  const page = await fetch(pageUrl, {
    headers: { Accept: 'text/html' },
    cache: 'no-store',
  })
  const html = await page.text()
  const responseHeaders = new Headers(page.headers)
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8')
  responseHeaders.set('Cache-Control', headers['Cache-Control'])
  responseHeaders.delete('Content-Encoding')
  responseHeaders.delete('Content-Length')
  responseHeaders.delete('Transfer-Encoding')
  return new Response(html, { status, headers: responseHeaders })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCloakedHtml(targetUrl: string): string {
  const escapedUrl = escapeHtml(targetUrl)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe src="${escapedUrl}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
  <noscript><a href="${escapedUrl}">继续访问</a></noscript>
</body>
</html>`
}

function passwordCookieName(slug: string): string {
  const encoded = encodeURIComponent(slug).replace(/[^A-Za-z0-9]/g, '_').slice(0, 120)
  return `suki_link_pass_${encoded}`
}

async function passwordCookieValue(slug: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(slug)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function redirectOrFail(request: NextRequest, params: Promise<{ slug: string }>): Promise<Response> {
  return (async (): Promise<Response> => {
    const { slug: rawSlug } = await params
    let slug = rawSlug
    try {
      slug = decodeURIComponent(rawSlug)
    }
    catch {
      /* ignore */
    }
    slug = normalizeSlug(slug)
    if (['favicon.ico', 'robots.txt', 'manifest.json'].includes(slug))
      return await statusPage(request, 404, 'not-found')
    const reserved = assertSlugAllowed(slug)
    if (reserved)
      return await statusPage(request, 404, 'not-found')

    const link = await getLink(slug)
    if (!link)
      return await statusPage(request, 404, 'not-found')

    if (link.expiration && link.expiration <= Math.floor(Date.now() / 1000)) {
      return await statusPage(request, 410, 'expired')
    }

    const verifiedPassword = request.cookies.get(passwordCookieName(slug))?.value
    const expectedPasswordToken = link.password
      ? await passwordCookieValue(slug, link.password)
      : undefined

    if (link.password && verifiedPassword !== expectedPasswordToken) {
      const passwordUrl = new URL('/password', request.url)
      passwordUrl.searchParams.set('slug', slug)
      if (request.nextUrl.search)
        passwordUrl.searchParams.set('query', request.nextUrl.search)
      return NextResponse.redirect(passwordUrl.toString(), 302)
    }

    const q = getSearchRecord(request)
    const targetUrl = buildTargetUrl(link.url, q, Boolean(link.redirectWithQuery))

    if (link.unsafe && request.nextUrl.searchParams.get('confirm') !== 'true') {
      const warningUrl = new URL('/link-status/confirm', request.url)
      warningUrl.searchParams.set('target', targetUrl)
      warningUrl.searchParams.set('slug', slug)
      return NextResponse.redirect(warningUrl.toString(), 302)
    }

    if (link.cloaking) {
      return new Response(buildCloakedHtml(targetUrl), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.redirect(targetUrl, getRedirectStatusCode())
  })()
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  return redirectOrFail(request, context.params)
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const res = await redirectOrFail(request, context.params)
  if ([301, 302, 307, 308].includes(res.status))
    return new Response(null, { status: res.status, headers: res.headers })
  if (res.status === 200) {
    return new Response(null, { status: 200, headers: res.headers })
  }
  return new Response(null, { status: res.status, headers: res.headers })
}
