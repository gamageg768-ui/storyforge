import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { targetType, targetId, reactionType } = await req.json()

  const existing = await prisma.reaction.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  })

  let action: string

  if (existing?.reactionType === reactionType) {
    await prisma.reaction.delete({ where: { userId_targetType_targetId: { userId, targetType, targetId } } })
    action = 'removed'
  } else if (existing) {
    await prisma.reaction.update({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      data:  { reactionType },
    })
    action = 'updated'
  } else {
    await prisma.reaction.create({ data: { userId, targetType, targetId, reactionType } })
    action = 'added'
  }

  const all = await prisma.reaction.findMany({ where: { targetType, targetId } })
  const counts: Record<string, number> = {}
  for (const r of all) {
    counts[r.reactionType] = (counts[r.reactionType] ?? 0) + 1
  }

  const userR = await prisma.reaction.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  })

  return Response.json({ action, counts, userReaction: userR?.reactionType ?? null })
}
