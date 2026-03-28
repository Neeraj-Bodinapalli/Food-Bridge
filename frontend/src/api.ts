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

/** In dev, connect straight to the API (port 4000) so Vite’s /ws proxy does not drop connections when the server broadcasts. */
export function getWebSocketUrl(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined
  if (configured?.length) {
    return configured
  }
  if (import.meta.env.DEV) {
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'
    return `ws://${host}:4000/ws`
  }
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = typeof window !== 'undefined' ? window.location.host : ''
  return `${proto}://${host}/ws`
}
