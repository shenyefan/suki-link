import { requireAuth } from '@/server/auth'
import { ok } from '@/server/response'

export async function POST(request: Request): Promise<Response> {
  const deny = await requireAuth(request)
  if (deny)
    return deny
  return ok({
    name: 'Moenya',
    url: 'https://suki.icu',
  })
}
