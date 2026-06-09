import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const targetId = Number(params.userId)
  const session  = await auth()
  const currentId = session?.user?.id ? Number(session.user.id) : null

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      stories: {
        include: {
          author:  { select: { username: true, avatarColor: true } },
          _count:  { select: { chapters: true, reactions: true, comments: true } },
          ratings: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      collaborations: {
        include: { story: { include: { author: { select: { username: true } } } } },
        where: { role: { not: 'author' } },
      },
      _count: { select: { followers: true, following: true } },
    },
  })

  if (!user) return Response.json({ error: 'Not found' }, { status: 404 })

  const isFollowing = currentId
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentId, followingId: targetId } },
      }))
    : false

  return Response.json({
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing,
    stories: user.stories.map(s => ({
      id: s.id, title: s.title, description: s.description, genre: s.genre,
      authorId: s.authorId, authorName: s.author.username, authorColor: s.author.avatarColor,
      status: s.status, coverColor: s.coverColor, tags: s.tags,
      createdAt: s.createdAt, updatedAt: s.updatedAt,
      chapterCount: s._count.chapters, reactionCount: s._count.reactions, commentCount: s._count.comments,
      avgRating: s.ratings.length ? s.ratings.reduce((a, r) => a + r.rating, 0) / s.ratings.length : null,
    })),
    collaborations: user.collaborations.map(c => ({
      id: c.story.id, title: c.story.title, coverColor: c.story.coverColor,
      genre: c.story.genre, role: c.role, authorName: c.story.author.username,
    })),
  })
}
