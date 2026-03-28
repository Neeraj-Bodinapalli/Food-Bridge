import { Router } from 'express'
import { asyncHandler } from '../asyncHandler.js'
import { query } from '../db.js'

export const dashboardRouter = Router()

dashboardRouter.get(
  '/impact',
  asyncHandler(async (_req, res) => {
    const r = await query<{ kg: string | null; listings: string }>(
      `SELECT
         COALESCE(SUM(quantity_kg), 0) AS kg,
         COUNT(*)::text AS listings
       FROM listings
       WHERE status = 'completed'`,
    )
    const row = r.rows[0]
    const kg = Number(row.kg ?? 0)
    const completed = Number(row.listings ?? 0)
    const meals_est = Math.round(kg * 2)
    const co2_kg_est = Math.round(kg * 2.5 * 10) / 10
    res.json({
      kg_saved: kg,
      meals_served_estimate: meals_est,
      co2_offset_kg_estimate: co2_kg_est,
      completed_listings: completed,
    })
  }),
)
