import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Load backend/.env no matter what folder you start `npm run dev` from */
const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(backendRoot, '.env') })

/** Windows editors often use CRLF; a stray \\r breaks the DB password in the URL */
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.trim()
}
