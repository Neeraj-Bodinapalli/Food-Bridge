import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { authRouter } from './routes/auth.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'foodbridge-api' })
})

app.use('/api/auth', authRouter)

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

app.listen(port, () => {
  console.log(`FoodBridge API listening on http://localhost:${port}`)
})
