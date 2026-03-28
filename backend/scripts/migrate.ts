import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import '../src/env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '..', 'db', 'schema.sql')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('Set DATABASE_URL in .env (see README).')
    process.exit(1)
  }
  const hostPort = url.replace(/^postgresql:\/\//, '').split('/')[0]
  const at = hostPort.lastIndexOf('@')
  console.log('Connecting to:', at >= 0 ? hostPort.slice(at + 1) : hostPort)

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  const sql = readFileSync(sqlPath, 'utf8')
  await client.query(sql)
  await client.end()
  console.log('Migration applied:', sqlPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
