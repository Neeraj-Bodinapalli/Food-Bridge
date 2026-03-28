import { query } from './db.js'
import { broadcast } from './realtime.js'

export async function expireActiveListings(): Promise<void> {
  const r = await query<{ id: string }>(
    `UPDATE listings SET status = 'expired'
     WHERE status = 'active' AND expires_at <= now()
     RETURNING id`,
  )
  for (const row of r.rows) {
    broadcast({ type: 'listing:expired', listing_id: row.id })
  }
}
