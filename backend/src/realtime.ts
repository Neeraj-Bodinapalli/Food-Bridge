import type { Server } from 'node:http'
import WebSocket, { WebSocketServer } from 'ws'

const clients = new Set<WebSocket>()

export function attachWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' })
  wss.on('connection', (ws) => {
    clients.add(ws)
    ws.on('close', () => {
      clients.delete(ws)
    })
  })
  return wss
}

export function broadcast(payload: Record<string, unknown>): void {
  const msg = JSON.stringify(payload)
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg)
    }
  }
}
