import { requireAuth } from '@/server/auth'
import { ok } from '@/server/response'

function clientIp(request: Request): string | undefined {
  return (
    request.headers.get('eo-client-ip')
    ?? request.headers.get('EO-Client-IP')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? undefined
  )
}

export async function GET(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  const lat = request.headers.get('eo-client-lat') ?? request.headers.get('x-geo-lat')
  const lon = request.headers.get('eo-client-lon') ?? request.headers.get('x-geo-lon')
  return ok({
    latitude: lat ? Number.parseFloat(lat) : undefined,
    longitude: lon ? Number.parseFloat(lon) : undefined,
    ip: clientIp(request),
  })
}
