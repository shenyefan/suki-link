/**
 * @param {unknown} data
 * @param {number} [status]
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * @typedef {Object} KvRequestBody
 * @property {unknown} [action]
 * @property {unknown} [key]
 * @property {unknown} [value]
 * @property {unknown} [prefix]
 * @property {unknown} [limit]
 * @property {unknown} [cursor]
 */

/**
 * @param {unknown} value
 */
function isObject(value) {
  return value !== null && typeof value === 'object'
}

/**
 * @param {unknown} value
 */
function isKvStore(value) {
  return Boolean(
      value
      && typeof value.get === 'function'
      && typeof value.put === 'function'
      && typeof value.delete === 'function'
      && typeof value.list === 'function',
  )
}

/**
 * EdgeOne exposes KV bindings as runtime variables, for example `link_kv.get(...)`.
 * This lets the bridge resolve the variable name configured by SUKI_KV_BINDING.
 *
 * @param {string} bindingName
 */
function getGlobalBinding(bindingName) {
  if (isKvStore(globalThis[bindingName])) {
    return globalThis[bindingName]
  }

  if (!/^[A-Za-z_$][\w$]*$/.test(bindingName)) {
    return null
  }

  try {
    return Function(`return typeof ${bindingName} === 'undefined' ? null : ${bindingName}`)()
  } catch {
    return null
  }
}

/**
 * @param {Record<string, unknown>} env
 */
function getKv(env) {
  const bindingName = typeof env.SUKI_KV_BINDING === 'string' && env.SUKI_KV_BINDING
      ? env.SUKI_KV_BINDING
      : 'link_kv'
  const kv = isKvStore(env[bindingName]) ? env[bindingName] : getGlobalBinding(bindingName)

  if (kv) {
    return { bindingName, kv }
  }

  return { bindingName, kv: null }
}

/**
 * EdgeOne KV keys only support digits, letters, and underscores. The normal app
 * key is `link_${slug}` and is stored as-is. The fallback keeps custom keys safe.
 *
 * @param {string} key
 */
function toStorageKey(key) {
  if (/^[A-Za-z0-9_]+$/.test(key)) {
    return key
  }

  const bytes = new TextEncoder().encode(key)
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `k_${hex}`
}

/**
 * @param {string} key
 */
function fromStorageKey(key) {
  if (!key.startsWith('k_')) {
    return key
  }

  const hex = key.slice(2)

  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) {
    return key
  }

  const bytes = new Uint8Array(hex.match(/../g).map(byte => Number.parseInt(byte, 16)))
  return new TextDecoder().decode(bytes)
}

export async function onRequestPost(context) {
  const { request, env } = context

  const token = request.headers.get('x-suki-token') || ''

  if (!env.SUKI_SITE_PASSWORD || token !== env.SUKI_SITE_PASSWORD) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const { bindingName, kv } = getKv(env)

  if (!kv) {
    return json({ ok: false, error: `kv binding not found: ${bindingName}` }, 503)
  }

  /** @type {KvRequestBody} */
  let body

  try {
    const parsed = await request.json()
    body = isObject(parsed) ? parsed : {}
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400)
  }

  const action = body.action
  const key = typeof body.key === 'string' ? body.key : ''
  const storageKey = key ? toStorageKey(key) : ''

  if (action !== 'list' && !key) {
    return json({ ok: false, error: 'missing key' }, 400)
  }

  try {
    switch (action) {
      case 'get': {
        const value = await kv.get(storageKey)
        return json({ ok: true, data: { value } })
      }

      case 'put': {
        if (typeof body.value !== 'string') {
          return json({ ok: false, error: 'missing value' }, 400)
        }

        await kv.put(storageKey, body.value)
        return json({ ok: true, data: null })
      }

      case 'delete': {
        await kv.delete(storageKey)
        return json({ ok: true, data: null })
      }

      case 'list': {
        const options = {
          prefix: typeof body.prefix === 'string' ? toStorageKey(body.prefix) : '',
        }

        if (typeof body.limit === 'number') {
          options.limit = body.limit
        }

        if (typeof body.cursor === 'string') {
          options.cursor = body.cursor
        }

        const result = await kv.list(options)

        return json({
          ok: true,
          data: {
            keys: await Promise.all(
                (result.keys ?? [])
                    .map(k => k.name || k.key || '')
                    .filter(Boolean)
                    .map(async storageName => ({
                      name: fromStorageKey(storageName),
                      value: await kv.get(storageName),
                    })),
            ),
            list_complete: result.list_complete ?? result.complete ?? true,
            cursor: result.cursor ?? undefined,
          },
        })
      }

      default:
        return json({ ok: false, error: 'unknown action' }, 400)
    }
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : 'kv operation failed',
    }, 500)
  }
}
