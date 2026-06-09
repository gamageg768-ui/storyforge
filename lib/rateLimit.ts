import { prisma } from './prisma'

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  const existing = await prisma.rateLimit.findUnique({ where: { key } })

  if (!existing || existing.expiresAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    })
    return true
  }

  if (existing.count >= limit) return false

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
  return true
}
