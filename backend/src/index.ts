import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'foodbridge-api' })
})

app.listen(port, () => {
  console.log(`FoodBridge API listening on http://localhost:${port}`)
})
