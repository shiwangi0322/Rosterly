import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma.js'
import { signToken } from '../middleware/auth.js'
import { HttpError } from '../utils/http.js'

export async function signup(req, res) {
  const email = req.body.email.trim().toLowerCase()
  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) throw new HttpError(409, 'An account with this email already exists.')

  const admin = await prisma.admin.create({
    data: {
      email,
      name: req.body.name.trim(),
      role: 'User',
      passwordHash: await bcrypt.hash(req.body.password, 10),
    },
  })
  const token = signToken(admin)
  res.status(201).json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  })
}

export async function login(req, res) {
  const email = req.body.email.toLowerCase()
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin) throw new HttpError(401, 'Email or password is incorrect.')
  const ok = await bcrypt.compare(req.body.password, admin.passwordHash)
  if (!ok) throw new HttpError(401, 'Email or password is incorrect.')
  const token = signToken(admin)
  res.json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  })
}

export async function me(req, res) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.sub } })
  if (!admin) throw new HttpError(401, 'Account no longer exists.')
  res.json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role })
}
