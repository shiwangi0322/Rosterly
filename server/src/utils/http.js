export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export function pageParams(query) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const order = query.order === 'desc' ? 'desc' : 'asc'
  return { page, limit, skip: (page - 1) * limit, order, search: String(query.search || '').trim() }
}

export function pageResult(data, total, page, limit) {
  return { data, page, limit, total, pages: Math.ceil(total / limit) || 1 }
}
