export interface KvStore {
  get: (key: string, opts?: { type?: 'json'; cacheTtl?: number }) => Promise<unknown | null>
  getWithMetadata: (
    key: string,
    opts?: { type?: 'json' },
  ) => Promise<{ value: unknown | null; metadata: Record<string, unknown> | null }>
  put: (
    key: string,
    value: string,
    opts?: { expiration?: number; metadata?: Record<string, unknown> },
  ) => Promise<void>
  delete: (key: string) => Promise<void>
  list: (opts: {
    prefix: string
    limit?: number
    cursor?: string
  }) => Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor?: string }>
}

class MemoryKv implements KvStore {
  private readonly data = new Map<string, string>()
  private readonly meta = new Map<string, Record<string, unknown>>()

  async get(key: string): Promise<unknown | null> {
    const raw = this.data.get(key)
    if (raw === undefined)
      return null
    try {
      return JSON.parse(raw) as unknown
    }
    catch {
      return null
    }
  }

  async getWithMetadata(key: string): Promise<{ value: unknown | null; metadata: Record<string, unknown> | null }> {
    const value = await this.get(key)
    return { value, metadata: this.meta.get(key) ?? null }
  }

  async put(key: string, value: string, opts?: { expiration?: number; metadata?: Record<string, unknown> }): Promise<void> {
    this.data.set(key, value)
    if (opts?.metadata)
      this.meta.set(key, opts.metadata)
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key)
    this.meta.delete(key)
  }

  async list(opts: { prefix: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }> {
    const limit = opts.limit ?? 1000
    const names = [...this.data.keys()].filter(k => k.startsWith(opts.prefix)).sort()
    let start = 0
    if (opts.cursor) {
      const idx = names.indexOf(opts.cursor)
      start = idx >= 0 ? idx + 1 : 0
    }
    const slice = names.slice(start, start + limit)
    const list_complete = start + slice.length >= names.length
    const cursor = list_complete ? undefined : slice.at(-1)
    return {
      keys: slice.map(name => ({ name })),
      list_complete,
      cursor,
    }
  }
}

interface NativeKv {
  get: (key: string, options?: { type?: 'json'; cacheTtl?: number }) => Promise<unknown | null>
  getWithMetadata?: (
    key: string,
    options?: { type?: 'json' },
  ) => Promise<{ value: unknown | null; metadata: Record<string, unknown> | null } | unknown | null>
  put: (
    key: string,
    value: string,
    options?: { expiration?: number; metadata?: Record<string, unknown> },
  ) => Promise<void>
  delete: (key: string) => Promise<void>
  list: (options: {
    prefix?: string
    limit?: number
    cursor?: string
  }) => Promise<{
    keys?: Array<{ name?: string; key?: string }>
    list_complete?: boolean
    complete?: boolean
    cursor?: string | null
  }>
}

function normalizeListResult(raw: Awaited<ReturnType<NativeKv['list']>>): {
  keys: Array<{ name: string }>
  list_complete: boolean
  cursor?: string
} {
  const list_complete = raw.list_complete ?? raw.complete ?? true
  const keys = (raw.keys ?? []).map((k) => {
    const name = k.name ?? k.key ?? ''
    return { name }
  }).filter(k => k.name.length > 0)
  const cursor = raw.cursor === null ? undefined : raw.cursor ?? undefined
  return { keys, list_complete, cursor }
}

function wrapNativeKv(kv: NativeKv): KvStore {
  return {
    get: (key, opts) => kv.get(key, opts),
    getWithMetadata: async (key, opts) => {
      if (typeof kv.getWithMetadata === 'function') {
        const r = await kv.getWithMetadata(key, opts)
        if (r && typeof r === 'object' && 'value' in r && 'metadata' in r) {
          return r as { value: unknown | null; metadata: Record<string, unknown> | null }
        }
      }
      const value = await kv.get(key, opts)
      return { value, metadata: null }
    },
    put: async (key, val, opts) => {
      try {
        await kv.put(key, val, opts)
      }
      catch {
        await kv.put(key, val)
      }
    },
    delete: key => kv.delete(key),
    list: async opts => normalizeListResult(await kv.list(opts)),
  }
}

const memorySingleton = new MemoryKv()

export function getKvStore(): KvStore {
  const g = globalThis as unknown as {
    __SUKI_KV__?: KvStore
    LINK_KV?: NativeKv
  }
  if (g.__SUKI_KV__)
    return g.__SUKI_KV__
  if (g.LINK_KV && typeof g.LINK_KV.get === 'function') {
    g.__SUKI_KV__ = wrapNativeKv(g.LINK_KV)
    return g.__SUKI_KV__
  }
  return memorySingleton
}

export function setKvStoreForTest(store: KvStore | undefined): void {
  const g = globalThis as unknown as { __SUKI_KV__?: KvStore }
  g.__SUKI_KV__ = store
}
