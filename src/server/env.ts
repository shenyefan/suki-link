function pickEnv(key: string): string {
  try {
    const p = typeof process !== 'undefined' ? process.env[key] : undefined
    if (p)
      return p
  }
  catch {
    /* ignore */
  }
  return ''
}

export function getSitePassword(): string {
  return pickEnv('SUKI_SITE_PASSWORD')
}

export function getCaseSensitive(): boolean {
  return pickEnv('SUKI_CASE_SENSITIVE_SLUG') === 'true'
}

export function getRedirectStatusCode(): number {
  const v = pickEnv('SUKI_REDIRECT_STATUS_CODE') || '301'
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : 301
}

export function getHomeUrl(): string {
  return pickEnv('SUKI_HOME_URL')
}

export function getKvBatchLimit(): number {
  const v = pickEnv('SUKI_KV_BATCH_LIMIT') || '50'
  const n = Number.parseInt(v, 10)
  return Math.max(1, Number.isFinite(n) ? n : 50)
}

export function getKvListMaxBatch(): number {
  const v = pickEnv('SUKI_KV_LIST_MAX') || '256'
  const n = Number.parseInt(v, 10)
  return Math.min(1024, Math.max(1, Number.isFinite(n) ? n : 256))
}

export function getPublicOrigin(request: Request): string {
  const envOrigin = pickEnv('SUKI_PUBLIC_ORIGIN').replace(/\/$/, '')
  if (envOrigin) {
    if (/^https?:\/\//i.test(envOrigin))
      return envOrigin
    return `https://${envOrigin}`
  }
  const u = new URL(request.url)
  return `${u.protocol}//${u.host}`
}

export function getMonitoringDomain(request: Request): string {
  return new URL(getPublicOrigin(request)).host
}

export function getSlugDefaultLength(): number {
  const v = pickEnv('SUKI_SLUG_DEFAULT_LENGTH') || '6'
  const n = Number.parseInt(v, 10)
  return Math.max(2, Number.isFinite(n) ? n : 6)
}

export function getSlugRegex(): RegExp {
  const raw = pickEnv('SUKI_SLUG_REGEX')
  if (raw) {
    try {
      return new RegExp(raw)
    }
    catch {
      /* fall through */
    }
  }
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i
}

export function getReserveSlugs(): string[] {
  const raw = pickEnv('SUKI_RESERVE_SLUGS') || 'api,assets,manage'
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export function getLinkCacheTtl(): number | undefined {
  const v = pickEnv('SUKI_LINK_CACHE_TTL')
  if (!v)
    return undefined
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

export function getTeoCredential(): { secretId: string; secretKey: string } | null {
  const secretId = pickEnv('SUKI_TEO_SECRET_ID')
  const secretKey = pickEnv('SUKI_TEO_SECRET_KEY')
  if (!secretId || !secretKey)
    return null
  return { secretId, secretKey }
}

export function getTeoRegion(): string {
  return pickEnv('SUKI_TEO_REGION') || 'ap-guangzhou'
}

export function getTeoFunctionName(): string {
  return pickEnv('SUKI_TEO_FUNCTION_NAME').trim()
}

export function getTeoFunctionNameFilterKey(): string {
  return pickEnv('SUKI_TEO_FUNCTION_NAME_FILTER_KEY').trim() || 'functionName'
}
