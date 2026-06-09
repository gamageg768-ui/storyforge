import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkAchievements } from '@/lib/achievements'

export async function POST(req: Request, { params }: { params: { storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)
  const { rating } = await req.json()

  if (rating === 0) {
    await prisma.rating.deleteMany({ where: { userId, storyId } })
  } else {
    await prisma.rating.upsert({
      where:  { userId_storyId: { userId, storyId } },
      update: { rating },
      create: { userId, storyId, rating },
    })
  }

  const allRatings = await prisma.rating.findMany({ where: { storyId }, select: { rating: true } })
  const avgRating  = allRatings.length ? allRatings.reduce((a, r) => a + r.rating, 0) / allRatings.length : null
  const userRating = rating === 0 ? null : rating

  if (rating === 5) {
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { authorId: true } })
    if (story) checkAchievements(story.authorId).catch(() => {})
  }

  return Response.json({ avgRating, ratingCount: allRatings.length, userRating })
}
