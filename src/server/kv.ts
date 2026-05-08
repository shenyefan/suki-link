import { headers } from 'next/headers'

import { getSitePassword } from '@/server/env'

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

export type KvStoreMode = 'native' | 'bridge' | 'memory' | 'test'

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

async function getBridgeUrl(): Promise<string | null> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    if (!host)
      return null
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
    return `${proto}://${host}/api/_suki-kv`
  }
  catch {
    return null
  }
}

async function bridgeRequest<T = unknown>(action: string, payload: Record<string, unknown>): Promise<T> {
  const token = getSitePassword()
  const url = await getBridgeUrl()
  if (!token || !url)
    throw new Error('EdgeOne KV bridge is unavailable')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-suki-kv-token': token,
    },
    body: JSON.stringify({ action, ...payload }),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null) as { ok?: boolean; error?: string; data?: T } | null
  if (!res.ok || !data?.ok)
    throw new Error(data?.error || `EdgeOne KV bridge failed: ${res.status}`)
  return data.data as T
}

class BridgeKv implements KvStore {
  async get(key: string, opts?: { type?: 'json' }): Promise<unknown | null> {
    const data = await bridgeRequest<{ value: string | null }>('get', { key })
    if (data.value === null)
      return null
    if (opts?.type === 'json') {
      try {
        return JSON.parse(data.value) as unknown
      }
      catch {
        return null
      }
    }
    return data.value
  }

  async getWithMetadata(key: string, opts?: { type?: 'json' }): Promise<{
    value: unknown | null
    metadata: Record<string, unknown> | null
  }> {
    return { value: await this.get(key, opts), metadata: null }
  }

  async put(key: string, value: string): Promise<void> {
    await bridgeRequest('put', { key, value })
  }

  async delete(key: string): Promise<void> {
    await bridgeRequest('delete', { key })
  }

  async list(opts: { prefix: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }> {
    const data = await bridgeRequest<Awaited<ReturnType<NativeKv['list']>>>('list', opts)
    return normalizeListResult(data)
  }
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
const bridgeSingleton = new BridgeKv()
const nativeBindingNames = ['Link', 'LINK_KV'] as const
let lastBindingProbe: Record<string, boolean> = {}

function isNativeKv(value: unknown): value is NativeKv {
  return Boolean(value && typeof value === 'object' && typeof (value as NativeKv).get === 'function')
}

function readRuntimeBinding(name: string): unknown {
  const g = globalThis as unknown as Record<string, unknown>
  if (isNativeKv(g[name]))
    return g[name]

  try {
    return Function(
      'name',
      'try { return (0, eval)(name) } catch { return undefined }',
    )(name) as unknown
  }
  catch {
    return undefined
  }
}

function findNativeKv(): { name: string; kv: NativeKv } | null {
  const probe: Record<string, boolean> = {}
  for (const name of nativeBindingNames) {
    const kv = readRuntimeBinding(name)
    probe[name] = isNativeKv(kv)
    if (isNativeKv(kv)) {
      lastBindingProbe = probe
      return { name, kv }
    }
  }
  lastBindingProbe = probe
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
  if (getSitePassword()) {
    g.__SUKI_KV__ = bridgeSingleton
    g.__SUKI_KV_MODE__ = 'bridge'
    g.__SUKI_KV_BINDING__ = '_suki-kv'
    return g.__SUKI_KV__
  }
  g.__SUKI_KV_MODE__ = 'memory'
  g.__SUKI_KV_BINDING__ = undefined
  return memorySingleton
}

export function getKvStoreStatus(): {
  mode: KvStoreMode
  binding?: string
  expectedBindings: string[]
  bindingProbe: Record<string, boolean>
} {
  getKvStore()
  const g = globalThis as unknown as {
    __SUKI_KV_MODE__?: KvStoreMode
    __SUKI_KV_BINDING__?: string
  }
  return {
    mode: g.__SUKI_KV_MODE__ ?? 'memory',
    binding: g.__SUKI_KV_BINDING__,
    expectedBindings: [...nativeBindingNames],
    bindingProbe: lastBindingProbe,
  }
}

export function setKvStoreForTest(store: KvStore | undefined): void {
  const g = globalThis as unknown as { __SUKI_KV__?: KvStore; __SUKI_KV_MODE__?: KvStoreMode }
  g.__SUKI_KV__ = store
  g.__SUKI_KV_MODE__ = store ? 'test' : undefined
}
