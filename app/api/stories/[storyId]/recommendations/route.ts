import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { storyId: string } }) {
  const storyId = Number(params.storyId)

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { genre: true } })
  if (!story) return Response.json([])

  const stories = await prisma.story.findMany({
    where: { genre: story.genre, id: { not: storyId } },
    include: {
      author:  { select: { username: true, avatarColor: true } },
      _count:  { select: { chapters: true, reactions: true } },
      ratings: { select: { rating: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  })

  const result = stories.map(s => ({
    id:           s.id,
    title:        s.title,
    genre:        s.genre,
    authorName:   s.author.username,
    authorColor:  s.author.avatarColor,
    coverColor:   s.coverColor,
    coverImage:   s.coverImage,
    chapterCount: s._count.chapters,
    reactionCount: s._count.reactions,
    avgRating: s.ratings.length
      ? s.ratings.reduce((a, r) => a + r.rating, 0) / s.ratings.length
      : null,
  }))

  return Response.json(result)
}
