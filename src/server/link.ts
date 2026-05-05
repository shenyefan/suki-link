import { parseURL, stringifyParsedURL, type QueryObject, withQuery } from 'ufo'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

import {
  getCaseSensitive,
  getKvListMaxBatch,
  getLinkCacheTtl,
  getPublicOrigin,
  getReserveSlugs,
  getSlugDefaultLength,
  getSlugRegex,
} from '@/server/env'
import type { KvStore } from '@/server/kv'
import { getKvStore } from '@/server/kv'
import { fail } from '@/server/response'

const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'

export function genSlug(length?: number): string {
  const len = length ?? getSlugDefaultLength()
  return customAlphabet(alphabet, len)()
}

export function createLinkSchema() {
  const slugRegex = getSlugRegex()
  const slugLen = getSlugDefaultLength()

  return z.object({
    url: z.string().trim().url().max(2048),
    slug: z.string().trim().max(2048).regex(slugRegex).default(() => genSlug(slugLen)),
    comment: z.string().trim().max(2048).optional(),
    createdAt: z.number().int().safe().default(() => Math.floor(Date.now() / 1000)),
    updatedAt: z.number().int().safe().default(() => Math.floor(Date.now() / 1000)),
    expiration: z
      .number()
      .int()
      .safe()
      .refine(exp => exp > Math.floor(Date.now() / 1000), {
        message: 'expiration must be greater than current time',
        path: ['expiration'],
      })
      .optional(),
    title: z.string().trim().max(256).optional(),
    description: z.string().trim().max(2048).optional(),
    image: z.string().trim().max(128).optional(),
    apple: z.string().trim().url().max(2048).optional(),
    google: z.string().trim().url().max(2048).optional(),
    cloaking: z.boolean().optional(),
    redirectWithQuery: z.boolean().optional(),
    password: z.string().trim().min(1).max(128).optional(),
    unsafe: z.boolean().optional(),
  })
}

export type Link = z.infer<ReturnType<typeof createLinkSchema>>

export type ApiLink = Omit<Link, 'password'> & {
  createTime: string
  updateTime: string
}

export function toApiLink(link: Link): ApiLink {
  const rest = { ...link }
  delete rest.password
  return {
    ...rest,
    createTime: new Date(link.createdAt * 1000).toISOString(),
    updateTime: new Date(link.updatedAt * 1000).toISOString(),
  }
}

export type AdminApiLink = Omit<Link, 'password'> & {
  password?: string
  createTime: string
  updateTime: string
}

export function toAdminApiLink(link: Link): AdminApiLink {
  return {
    ...link,
    createTime: new Date(link.createdAt * 1000).toISOString(),
    updateTime: new Date(link.updatedAt * 1000).toISOString(),
  }
}

export function assertSlugAllowed(slug: string): Response | null {
  const reserved = getReserveSlugs()
  if (reserved.includes(slug))
    return fail(400, `slug 为系统保留: ${slug}`, 400)
  return null
}

const importLinkSchema = createLinkSchema()
  .omit({ expiration: true })
  .extend({
    expiration: z.number().int().safe().optional(),
  })

export const ImportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string().optional(),
  count: z.number().int().optional(),
  links: z.array(importLinkSchema).min(1),
})

export type ImportData = z.infer<typeof ImportDataSchema>

export interface ImportResultItem {
  index: number
  slug: string
  url: string
}

export interface ImportResult {
  success: number
  skipped: number
  failed: number
  successItems: ImportResultItem[]
  skippedItems: ImportResultItem[]
  failedItems: (ImportResultItem & { reason: string })[]
}

export interface ExportData {
  version: string
  exportedAt: string
  count: number
  links: ApiLink[]
  cursor?: string
  list_complete: boolean
}

export function withoutQuery(url: string): string {
  const parsed = parseURL(url)
  return stringifyParsedURL({ ...parsed, search: '' })
}

export function normalizeSlug(slug: string): string {
  return getCaseSensitive() ? slug : slug.toLowerCase()
}

export function buildShortLink(request: Request, slug: string): string {
  return `${getPublicOrigin(request)}/${slug}`
}

function kv(): KvStore {
  return getKvStore()
}

export async function putLink(link: Link): Promise<void> {
  const expiration = link.expiration
  await kv().put(`link:${link.slug}`, JSON.stringify(link), {
    expiration,
    metadata: {
      expiration,
      url: withoutQuery(link.url),
      comment: link.comment,
    },
  })
}

export async function getLink(slug: string): Promise<Link | null> {
  const cacheTtl = getLinkCacheTtl()
  const raw = await kv().get(`link:${slug}`, { type: 'json', cacheTtl }) as Link | null
  return raw ?? null
}

export async function getLinkWithMetadata(slug: string): Promise<{
  link: Link | null
  metadata: Record<string, unknown> | null
}> {
  const { value, metadata } = await kv().getWithMetadata(`link:${slug}`, { type: 'json' })
  return { link: value as Link | null, metadata }
}

export async function deleteLink(slug: string): Promise<void> {
  await kv().delete(`link:${slug}`)
}

export async function linkExists(slug: string): Promise<boolean> {
  const link = await getLink(slug)
  return link !== null
}

interface ListLinksOptions {
  limit: number
  cursor?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'az' | 'za'
}

interface ListLinksResult {
  links: (Link | null)[]
  list_complete: boolean
  cursor?: string
}

export async function listLinks(options: ListLinksOptions): Promise<ListLinksResult> {
  if (options.search || options.sort)
    return listFilteredLinks(options)

  const limit = Math.min(options.limit, getKvListMaxBatch())
  const list = await kv().list({ prefix: 'link:', limit, cursor: options.cursor })

  const links = await Promise.all(
    list.keys.map(async (key: { name: string }) => {
      const { metadata, value } = await kv().getWithMetadata(key.name, { type: 'json' }) as {
        metadata: Record<string, unknown> | null
        value: Link | null
      }
      if (value) {
        return {
          ...(metadata ?? {}),
          ...value,
        }
      }
      return null
    }),
  )

  return {
    links,
    list_complete: list.list_complete,
    cursor: 'cursor' in list ? list.cursor : undefined,
  }
}

async function listFilteredLinks(options: ListLinksOptions): Promise<ListLinksResult> {
  const batchLimit = getKvListMaxBatch()
  const all: Link[] = []
  let cursor: string | undefined
  let listComplete = false

  while (!listComplete) {
    const list = await kv().list({ prefix: 'link:', limit: batchLimit, cursor })
    const links = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const { metadata, value } = await kv().getWithMetadata(key.name, { type: 'json' }) as {
          metadata: Record<string, unknown> | null
          value: Link | null
        }
        return value ? { ...(metadata ?? {}), ...value } : null
      }),
    )
    all.push(...links.filter((link): link is Link => link !== null))
    listComplete = list.list_complete
    cursor = list.cursor
    if (!cursor && !listComplete)
      break
  }

  const q = options.search?.trim().toLowerCase()
  const filtered = q
    ? all.filter(link => (
        link.slug.toLowerCase().includes(q)
        || link.url.toLowerCase().includes(q)
        || (link.comment?.toLowerCase().includes(q) ?? false)
      ))
    : all

  filtered.sort((a, b) => {
    switch (options.sort) {
      case 'oldest':
        return (a.createdAt ?? 0) - (b.createdAt ?? 0)
      case 'az':
        return a.slug.localeCompare(b.slug)
      case 'za':
        return b.slug.localeCompare(a.slug)
      case 'newest':
      default:
        return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    }
  })

  const limit = Math.min(options.limit, batchLimit)
  const offset = Number.parseInt(options.cursor ?? '0', 10)
  const start = Number.isFinite(offset) && offset > 0 ? offset : 0
  const slice = filtered.slice(start, start + limit)
  const nextOffset = start + slice.length

  return {
    links: slice,
    list_complete: nextOffset >= filtered.length,
    cursor: nextOffset >= filtered.length ? undefined : String(nextOffset),
  }
}

export function buildTargetUrl(
  url: string,
  query: Record<string, string | string[] | undefined>,
  withQ: boolean,
): string {
  if (!withQ)
    return url
  return withQuery(url, query as QueryObject)
}
