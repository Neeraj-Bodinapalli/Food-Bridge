import pg from 'pg'

const connectionString = process.env.DATABASE_URL

export const pool = connectionString
  ? new pg.Pool({ connectionString, max: 10 })
  : null

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  if (!pool) {
    throw new Error('DATABASE_URL is not set')
  }
  return pool.query<T>(text, params)
}
