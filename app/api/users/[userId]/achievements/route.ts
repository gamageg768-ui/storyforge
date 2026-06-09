import { prisma } from '@/lib/prisma'
import { ACHIEVEMENTS } from '@/lib/achievements'

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const userId = Number(params.userId)

  const earned = await prisma.userAchievement.findMany({
    where:   { userId },
    orderBy: { earnedAt: 'asc' },
  })

  return Response.json(
    earned.map(a => ({
      id:          a.id,
      achievement: a.achievement,
      earnedAt:    a.earnedAt,
      ...ACHIEVEMENTS[a.achievement],
    }))
  )
}
