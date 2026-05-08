/* global Link, LINK_KV */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function getKvBinding() {
  if (typeof Link !== 'undefined' && Link && typeof Link.get === 'function')
    return Link
  if (typeof LINK_KV !== 'undefined' && LINK_KV && typeof LINK_KV.get === 'function')
    return LINK_KV
  return null
}

function getSecret(context) {
  return context.env?.SUKI_KV_BRIDGE_TOKEN || context.env?.SUKI_SITE_PASSWORD || ''
}

export async function onRequestPost(context) {
  const secret = getSecret(context)
  const token = context.request.headers.get('x-suki-kv-token') || ''
  if (!secret || token !== secret)
    return json({ ok: false, error: 'unauthorized' }, 401)

  const kv = getKvBinding()
  if (!kv)
    return json({ ok: false, error: 'kv binding not found' }, 503)

  let body
  try {
    body = await context.request.json()
  }
  catch {
    return json({ ok: false, error: 'invalid json' }, 400)
  }

  const key = typeof body.key === 'string' ? body.key : ''
  if (body.action !== 'list' && !key)
    return json({ ok: false, error: 'missing key' }, 400)

  try {
    switch (body.action) {
      case 'get': {
        const value = await kv.get(key)
        return json({ ok: true, data: { value } })
      }
      case 'put': {
        if (typeof body.value !== 'string')
          return json({ ok: false, error: 'missing value' }, 400)
        await kv.put(key, body.value)
        return json({ ok: true, data: null })
      }
      case 'delete': {
        await kv.delete(key)
        return json({ ok: true, data: null })
      }
      case 'list': {
        const options = {
          prefix: typeof body.prefix === 'string' ? body.prefix : '',
        }
        if (typeof body.limit === 'number')
          options.limit = body.limit
        if (typeof body.cursor === 'string')
          options.cursor = body.cursor
        const result = await kv.list(options)
        return json({ ok: true, data: result })
      }
      default:
        return json({ ok: false, error: 'unknown action' }, 400)
    }
  }
  catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : 'kv operation failed',
    }, 500)
  }
}
