import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const entries = await prisma.challengeEntry.findMany({
    where: { userId },
    include: { challenge: true },
    orderBy: { joinedAt: 'desc' },
  })

  return Response.json(entries)
}
