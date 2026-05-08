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

declare const Link: NativeKv | undefined
declare const LINK_KV: NativeKv | undefined

export type KvStoreMode = 'native' | 'memory' | 'test'

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
const nativeBindingNames = ['Link', 'LINK_KV'] as const

function directNativeKvBindings(): Record<string, NativeKv | undefined> {
  return {
    Link: typeof Link !== 'undefined' ? Link : undefined,
    LINK_KV: typeof LINK_KV !== 'undefined' ? LINK_KV : undefined,
  }
}

function findNativeKv(): { name: string; kv: NativeKv } | null {
  const direct = directNativeKvBindings()
  for (const name of nativeBindingNames) {
    const kv = direct[name]
    if (kv && typeof kv.get === 'function')
      return { name, kv }
  }

  const g = globalThis as unknown as Record<string, unknown>
  for (const name of nativeBindingNames) {
    const kv = g[name]
    if (kv && typeof kv === 'object' && typeof (kv as NativeKv).get === 'function')
      return { name, kv: kv as NativeKv }
  }
  return null
}

export function getKvStore(): KvStore {
  const g = globalThis as unknown as {
    __SUKI_KV__?: KvStore
    __SUKI_KV_MODE__?: KvStoreMode
    __SUKI_KV_BINDING__?: string
  }
  if (g.__SUKI_KV__)
    return g.__SUKI_KV__
  const native = findNativeKv()
  if (native) {
    g.__SUKI_KV__ = wrapNativeKv(native.kv)
    g.__SUKI_KV_MODE__ = 'native'
    g.__SUKI_KV_BINDING__ = native.name
    return g.__SUKI_KV__
  }
  g.__SUKI_KV_MODE__ = 'memory'
  g.__SUKI_KV_BINDING__ = undefined
  return memorySingleton
}

export function getKvStoreStatus(): { mode: KvStoreMode; binding?: string; expectedBindings: string[] } {
  getKvStore()
  const g = globalThis as unknown as {
    __SUKI_KV_MODE__?: KvStoreMode
    __SUKI_KV_BINDING__?: string
  }
  return {
    mode: g.__SUKI_KV_MODE__ ?? 'memory',
    binding: g.__SUKI_KV_BINDING__,
    expectedBindings: [...nativeBindingNames],
  }
}

export function setKvStoreForTest(store: KvStore | undefined): void {
  const g = globalThis as unknown as { __SUKI_KV__?: KvStore; __SUKI_KV_MODE__?: KvStoreMode }
  g.__SUKI_KV__ = store
  g.__SUKI_KV_MODE__ = store ? 'test' : undefined
}
