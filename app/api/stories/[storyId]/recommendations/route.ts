import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { storyId: string } }) {
  const storyId = Number(params.storyId)

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { genre: true } })
  if (!story) return Response.json([])

  // Collaborative filtering: users who read this story also read…
  const readers = await prisma.readChapter.findMany({
    where: { storyId },
    select: { userId: true },
    distinct: ['userId'],
    take: 200,
  })

  let topIds: number[] = []

  if (readers.length >= 3) {
    const uids = readers.map(r => r.userId)
    const coRead = await prisma.readChapter.groupBy({
      by: ['storyId'],
      where: { userId: { in: uids }, storyId: { not: storyId } },
      _count: { storyId: true },
      orderBy: { _count: { storyId: 'desc' } },
      take: 6,
    })
    topIds = coRead.map(r => r.storyId)
  }

  // Fetch matched stories, backfill with genre-based if fewer than 4
  const collaborative = topIds.length > 0
    ? await prisma.story.findMany({
        where: { id: { in: topIds }, isAdult: false },
        include: {
          author:  { select: { username: true, avatarColor: true } },
          _count:  { select: { chapters: true, reactions: true } },
          ratings: { select: { rating: true } },
        },
      })
    : []

  const needed = 6 - collaborative.length
  const genreFill = needed > 0
    ? await prisma.story.findMany({
        where: {
          genre: story.genre,
          id: { not: storyId, notIn: [...topIds, ...collaborative.map(s => s.id)] },
          isAdult: false,
        },
        include: {
          author:  { select: { username: true, avatarColor: true } },
          _count:  { select: { chapters: true, reactions: true } },
          ratings: { select: { rating: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: needed,
      })
    : []

  const stories = [...collaborative, ...genreFill]

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
