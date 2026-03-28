export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = import.meta.env.VITE_API_URL as string | undefined
  if (base && base.length > 0) {
    return `${base.replace(/\/$/, '')}${normalized}`
  }
  return normalized
}

export async function apiFetch(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = init?.token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const { token: _t, ...rest } = init ?? {}
  return fetch(apiUrl(path), { ...rest, headers })
}
