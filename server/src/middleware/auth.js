import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http.js'

export function signToken(admin) {
  return jwt.sign({ sub: admin.id, email: admin.email, role: admin.role, name: admin.name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return next(new HttpError(401, 'Sign in required.'))
  try {
    req.admin = jwt.verify(token, env.jwtSecret)
    next()
  } catch {
    next(new HttpError(401, 'Session expired or invalid. Sign in again.'))
  }
}
