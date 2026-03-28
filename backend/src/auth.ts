import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { Request, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { query } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-me'

export type JwtUser = { id: string; role: string }

export function signToken(user: JwtUser): string {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtUser {
  const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string }
  return { id: decoded.sub, role: decoded.role }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }
  try {
    ;(req as Request & { user?: JwtUser }).user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\s+/g, '')
  return createHash('sha256').update(normalized).digest('hex')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function findUserByPhoneHash(phoneHash: string) {
  const r = await query<{ id: string; role: string; name: string; password_hash: string }>(
    `SELECT id, role, name, password_hash FROM users WHERE phone_hash = $1`,
    [phoneHash],
  )
  return r.rows[0] ?? null
}
