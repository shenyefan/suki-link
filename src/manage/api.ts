const TOKEN_KEY = 'suki.admin.token'

export function getAdminToken(): string | null {
  if (typeof sessionStorage === 'undefined')
    return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

type ApiEnvelope<T> = {
  code: number
  data: T
  message: string
  timestamp: string
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null
  if (token)
    headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json')
  const res = await fetch(path, { ...init, headers })
  const json = (await res.json()) as ApiEnvelope<T> & { message?: string; code?: number }
  if (!res.ok)
    throw new Error(json.message || `HTTP ${res.status}`)
  if (json.code !== 200)
    throw new Error(json.message || '请求失败')
  return json.data
}

export async function login(password: string): Promise<string> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const json = (await res.json()) as ApiEnvelope<{ token: string }>
  if (!res.ok || json.code !== 200)
    throw new Error(json.message || '登录失败')
  return json.data.token
}
