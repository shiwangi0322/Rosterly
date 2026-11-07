import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { HttpError } from '../utils/http.js'

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` })
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A record with that value already exists.' })
    if (err.code === 'P2003') return res.status(409).json({ error: 'That change would break a related record.' })
    if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found.' })
  }
  const status = err instanceof HttpError ? err.status : err.status || 500
  const body = { error: status === 500 ? 'Something went wrong.' : err.message }
  if (err.details) body.details = err.details
  if (status === 500 && process.env.NODE_ENV !== 'production') body.detail = err.message
  res.status(status).json(body)
}
