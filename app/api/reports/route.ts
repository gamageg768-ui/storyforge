import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const allowed = await rateLimit(`report:${userId}`, 10, 60 * 60 * 1000)
  if (!allowed) return Response.json({ error: 'Too many reports. Try again later.' }, { status: 429 })

  const { targetType, targetId, reason } = await req.json()
  if (!targetType || !targetId || !reason?.trim()) {
    return Response.json({ error: 'targetType, targetId, and reason are required' }, { status: 400 })
  }

  const validTypes = ['story', 'chapter', 'comment', 'user']
  if (!validTypes.includes(targetType)) {
    return Response.json({ error: 'Invalid targetType' }, { status: 400 })
  }

  const report = await prisma.report.create({
    data: { reporterId: userId, targetType, targetId: Number(targetId), reason: reason.trim() },
  })

  return Response.json(report, { status: 201 })
}
