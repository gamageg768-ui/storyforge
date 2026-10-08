import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const tips = await prisma.tipTransaction.findMany({
    where: { toAuthorId: userId, status: 'completed' },
    include: { fromUser: { select: { username: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const total = await prisma.tipTransaction.aggregate({
    where: { toAuthorId: userId, status: 'completed' },
    _sum: { amount: true },
    _count: { id: true },
  })

  return Response.json({
    tips,
    totalAmount: total._sum.amount ?? 0,
    totalCount:  total._count.id,
  })
}
