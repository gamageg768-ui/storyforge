import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const followingIds = following.map(f => f.followingId)

  const stories = await prisma.story.findMany({
    where: { authorId: { in: followingIds } },
    include: {
      author:  { select: { username: true, avatarColor: true } },
      _count:  { select: { chapters: true, reactions: true, comments: true, ratings: true } },
      ratings: { select: { rating: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  return Response.json(stories.map(s => {
    const avgRating = s.ratings.length
      ? s.ratings.reduce((a, r) => a + r.rating, 0) / s.ratings.length
      : null
    return {
      id: s.id, title: s.title, description: s.description, genre: s.genre,
      authorId: s.authorId, authorName: s.author.username, authorColor: s.author.avatarColor,
      status: s.status, coverColor: s.coverColor, tags: s.tags,
      createdAt: s.createdAt, updatedAt: s.updatedAt,
      chapterCount: s._count.chapters, reactionCount: s._count.reactions,
      commentCount: s._count.comments, avgRating, ratingCount: s._count.ratings,
    }
  }))
}
