import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const targetType = searchParams.get('target_type') as string
  const targetId   = Number(searchParams.get('target_id'))
  const session    = await auth()
  const userId     = session?.user?.id ? Number(session.user.id) : null

  const all = await prisma.reaction.findMany({ where: { targetType, targetId } })
  const counts: Record<string, number> = {}
  for (const r of all) {
    counts[r.reactionType] = (counts[r.reactionType] ?? 0) + 1
  }

  const userReaction = userId
    ? (all.find(r => r.userId === userId)?.reactionType ?? null)
    : null

  return Response.json({ counts, userReaction })
}
