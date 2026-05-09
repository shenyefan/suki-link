import { parseURL, stringifyParsedURL, type QueryObject, withQuery } from 'ufo'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

import {
  getCaseSensitive,
  getKvListMaxBatch,
  getPublicOrigin,
  getReserveSlugs,
  getSlugDefaultLength,
  getSlugRegex,
} from '@/server/env'
import { kv } from '@/server/kv'
import { fail } from '@/server/response'

const slugAlphabet = '23456789abcdefghjkmnpqrstuvwxyz'
const idAlphabet = '0123456789abcdefghijklmnopqrstuvwxyz'

export function genSlug(length?: number): string {
  return customAlphabet(slugAlphabet, length ?? getSlugDefaultLength())()
}

export function genId(): string {
  return customAlphabet(idAlphabet, 16)()
}

let _cachedSchema: ReturnType<typeof buildLinkSchema> | null = null

function buildLinkSchema() {
  const slugRegex = getSlugRegex()
  const slugLen = getSlugDefaultLength()
  const now = () => Math.floor(Date.now() / 1000)
  const futureTimestamp = z.number().int().safe().refine(expiration => expiration > now(), {
    message: '过期时间必须晚于当前时间',
    path: ['expiration'],
  })

  return z.object({
    id: z.string().length(16).default(() => genId()),
    url: z.string().trim().url().max(2048),
    slug: z.string().trim().max(2048).regex(slugRegex).default(() => genSlug(slugLen)),
    comment: z.string().trim().max(2048).optional(),
    createdAt: z.number().int().safe().default(now),
    updatedAt: z.number().int().safe().default(now),
    expiration: futureTimestamp.optional(),
    redirectWithQuery: z.boolean().optional(),
    cloaking: z.boolean().optional(),
    password: z.string().trim().min(1).max(128).optional(),
    unsafe: z.boolean().optional(),
  })
}

export function createLinkSchema() {
  _cachedSchema ??= buildLinkSchema()
  return _cachedSchema
}

export type Link = z.infer<ReturnType<typeof buildLinkSchema>>

export type ApiLink = Omit<Link, 'password'> & {
  createTime: string
  updateTime: string
}

export function toApiLink(link: Link): ApiLink {
  const { password, ...rest } = link
  void password

  return {
    ...rest,
    createTime: new Date(link.createdAt * 1000).toISOString(),
    updateTime: new Date(link.updatedAt * 1000).toISOString(),
  }
}

export type AdminApiLink = Link & {
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

function buildImportLinkSchema() {
  return createLinkSchema()
      .omit({ expiration: true })
      .extend({ expiration: z.number().int().safe().optional() })
}

export function createImportDataSchema() {
  return z.object({
    version: z.string(),
    exportedAt: z.string().optional(),
    count: z.number().int().optional(),
    links: z.array(buildImportLinkSchema()).min(1),
  })
}

export type ImportData = z.infer<ReturnType<typeof createImportDataSchema>>

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
  failedItems: Array<ImportResultItem & { reason: string }>
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

export function buildTargetUrl(
    url: string,
    query: Record<string, string | string[] | undefined>,
    appendQuery: boolean,
): string {
  return appendQuery ? withQuery(url, query as QueryObject) : url
}

export function assertSlugAllowed(slug: string): Response | null {
  if (getReserveSlugs().includes(slug)) {
    return fail(400, `slug 为系统保留: ${slug}`, 400)
  }

  return null
}

function linkKey(slug: string): string {
  return `link_${slug}`
}

function parseLink(raw: string | null): Link | null {
  if (!raw) return null

  try {
    return JSON.parse(raw) as Link
  } catch {
    return null
  }
}

export async function putLink(
    link: Link,
    ifNotExists = false,
): Promise<{ ok: true } | { ok: false; conflict: true }> {
  if (ifNotExists) {
    const existing = await getLink(link.slug)

    if (existing) {
      return { ok: false, conflict: true }
    }
  }

  await kv.put(linkKey(link.slug), JSON.stringify(link))

  return { ok: true }
}

export async function getLink(slug: string): Promise<Link | null> {
  return parseLink(await kv.get(linkKey(slug)))
}

export async function renameSlug(
    link: Link,
    newSlug: string,
): Promise<{ ok: true } | { ok: false; conflict: true }> {
  const updated: Link = {
    ...link,
    slug: newSlug,
    updatedAt: Math.floor(Date.now() / 1000),
  }

  const result = await putLink(updated, true)

  if (!result.ok) {
    return result
  }

  await kv.delete(linkKey(link.slug))

  return { ok: true }
}

export async function deleteLink(slug: string): Promise<void> {
  await kv.delete(linkKey(slug))
}

export async function linkExists(slug: string): Promise<boolean> {
  return (await getLink(slug)) !== null
}

export type SortOrder = 'newest' | 'oldest' | 'az' | 'za'

export interface ListLinksOptions {
  limit: number
  cursor?: string
  search?: string
  sort?: SortOrder
}

export interface ListLinksResult {
  links: Link[]
  list_complete: boolean
  cursor?: string
}

export async function listLinks(options: ListLinksOptions): Promise<ListLinksResult> {
  return options.search || options.sort
      ? listFilteredLinks(options)
      : listRawLinks(options)
}

async function listRawLinks(options: ListLinksOptions): Promise<ListLinksResult> {
  const limit = Math.min(options.limit, getKvListMaxBatch())

  const list = await kv.list({
    prefix: 'link_',
    limit,
    cursor: options.cursor,
  })

  const links = list.keys.map(key => parseLink(key.value ?? null))

  return {
    links: links.filter((link): link is Link => link !== null),
    list_complete: list.list_complete,
    cursor: list.list_complete ? undefined : list.cursor,
  }
}

async function listFilteredLinks(options: ListLinksOptions): Promise<ListLinksResult> {
  const batchLimit = getKvListMaxBatch()
  const allLinks: Link[] = []

  let kvCursor: string | undefined
  let listComplete = false

  while (!listComplete) {
    const list = await kv.list({
      prefix: 'link_',
      limit: batchLimit,
      cursor: kvCursor,
    })

    const links = list.keys.map(key => parseLink(key.value ?? null))

    allLinks.push(...links.filter((link): link is Link => link !== null))

    listComplete = list.list_complete
    kvCursor = listComplete ? undefined : list.cursor
  }

  const q = options.search?.trim().toLowerCase()

  const filtered = q
      ? allLinks.filter(link =>
          link.slug.toLowerCase().includes(q)
          || link.url.toLowerCase().includes(q)
          || (link.comment?.toLowerCase().includes(q) ?? false),
      )
      : allLinks

  const sort = options.sort ?? 'newest'

  filtered.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.createdAt - b.createdAt
      case 'az':
        return a.slug.localeCompare(b.slug)
      case 'za':
        return b.slug.localeCompare(a.slug)
      default:
        return b.createdAt - a.createdAt
    }
  })

  const limit = Math.min(options.limit, batchLimit)
  let startIndex = 0

  if (options.cursor) {
    const colonIdx = options.cursor.indexOf(':')

    if (colonIdx >= 0) {
      const cursorTs = Number(options.cursor.slice(0, colonIdx))
      const cursorSlug = options.cursor.slice(colonIdx + 1)

      const idx = filtered.findIndex(
          link => link.createdAt === cursorTs && link.slug === cursorSlug,
      )

      startIndex = idx >= 0 ? idx + 1 : 0
    }
  }

  const slice = filtered.slice(startIndex, startIndex + limit)
  const isComplete = startIndex + slice.length >= filtered.length
  const last = slice.at(-1)

  return {
    links: slice,
    list_complete: isComplete,
    cursor: isComplete || !last ? undefined : `${last.createdAt}:${last.slug}`,
  }
}
