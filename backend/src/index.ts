import './env.js'
import http from 'node:http'
import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { listingsRouter } from './routes/listings.js'
import { expireActiveListings } from './expire.js'
import { attachWebSocket } from './realtime.js'

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'foodbridge-api' })
})

app.use('/api/auth', authRouter)
app.use('/api/listings', listingsRouter)
app.use('/api/dashboard', dashboardRouter)

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    if (err.message === 'DATABASE_URL is not set') {
      res.status(503).json({ error: 'Database not configured. Set DATABASE_URL and run migrations.' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  },
)

const server = http.createServer(app)
attachWebSocket(server)

const EXPIRE_MS = 60_000
setInterval(() => {
  void (async () => {
    try {
      await expireActiveListings()
    } catch {
      /* DB offline or not configured */
    }
  })()
}, EXPIRE_MS)

server.listen(port, () => {
  console.log(`FoodBridge API listening on http://localhost:${port}`)
  console.log(`WebSocket feed at ws://localhost:${port}/ws`)
})
