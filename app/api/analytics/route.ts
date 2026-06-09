import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const stories = await prisma.story.findMany({
    where: { authorId: userId },
    include: {
      chapters: {
        include: { views: true },
        orderBy: { chapterOrder: 'asc' },
      },
      ratings: { select: { rating: true } },
      _count: { select: { reactions: true, comments: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const followerCount = await prisma.follow.count({ where: { followingId: userId } })

  const result = stories.map(s => {
    const totalViews = s.chapters.reduce((sum, ch) => sum + ch.views.length, 0)
    const avgRating = s.ratings.length
      ? s.ratings.reduce((a, r) => a + r.rating, 0) / s.ratings.length
      : null
    return {
      id:           s.id,
      title:        s.title,
      coverColor:   s.coverColor,
      coverImage:   s.coverImage,
      genre:        s.genre,
      status:       s.status,
      totalViews,
      reactionCount: s._count.reactions,
      commentCount:  s._count.comments,
      ratingCount:   s.ratings.length,
      avgRating,
      chapters: s.chapters.map(ch => ({
        id:    ch.id,
        title: ch.title,
        order: ch.chapterOrder,
        views: ch.views.length,
      })),
    }
  })

  const totals = {
    totalViews:    result.reduce((sum, s) => sum + s.totalViews, 0),
    totalStories:  result.length,
    followerCount,
    totalReactions: result.reduce((sum, s) => sum + s.reactionCount, 0),
  }

  return Response.json({ stories: result, totals })
}
