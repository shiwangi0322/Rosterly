import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const email = (process.env.ADMIN_EMAIL || '').toLowerCase()
const password = process.env.ADMIN_PASSWORD || ''
const admins = await prisma.admin.findMany({ select: { id: true, email: true, name: true, role: true, passwordHash: true } })
const match = []
for (const admin of admins) {
  match.push({
    email: admin.email,
    name: admin.name,
    role: admin.role,
    hashLooksLikeBcrypt: typeof admin.passwordHash === 'string' && admin.passwordHash.startsWith('$2'),
    passwordMatchesEnv: password ? await bcrypt.compare(password, admin.passwordHash) : false,
  })
}
console.log(JSON.stringify({
  envEmail: email,
  envPasswordSet: Boolean(password),
  envPasswordLength: password.length,
  adminCount: admins.length,
  admins: match,
}, null, 2))
await prisma.$disconnect()
