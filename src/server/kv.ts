import { headers } from 'next/headers'

import { getSitePassword } from '@/server/env'

export interface KvListOptions {
    prefix: string
    limit?: number
    cursor?: string
}

export interface KvListResult {
    keys: Array<{ name: string; value?: string | null }>
    list_complete: boolean
    cursor?: string
}

export interface KvStore {
    get: (key: string) => Promise<string | null>
    put: (key: string, value: string) => Promise<void>
    delete: (key: string) => Promise<void>
    list: (opts: KvListOptions) => Promise<KvListResult>
}

async function getKvBridgeUrl(): Promise<string> {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')

    if (!host) {
        throw new Error('cannot determine host for KV bridge')
    }

    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    const proto = h.get('x-forwarded-proto') || (isLocal ? 'http' : 'https')

    return `${proto}://${host}/api/suki-kv`
}

async function call<T>(
    action: string,
    payload: Record<string, unknown>,
): Promise<T> {
    const token = getSitePassword()

    if (!token) {
        throw new Error('SUKI_SITE_PASSWORD not set')
    }

    const res = await fetch(await getKvBridgeUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-suki-token': token,
        },
        body: JSON.stringify({ action, ...payload }),
        cache: 'no-store',
    })

    const data = await res.json().catch(() => null) as {
        ok?: boolean
        error?: string
        data?: T
    } | null

    if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? `KV bridge error ${res.status}`)
    }

    return data.data as T
}

export const kv: KvStore = {
    async get(key: string): Promise<string | null> {
        const { value } = await call<{ value: string | null }>('get', { key })
        return value
    },

    async put(key: string, value: string): Promise<void> {
        await call<null>('put', { key, value })
    },

    async delete(key: string): Promise<void> {
        await call<null>('delete', { key })
    },

    async list(opts: KvListOptions): Promise<KvListResult> {
        return call<KvListResult>('list', { ...opts })
    },
}
