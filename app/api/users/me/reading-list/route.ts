import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const entries = await prisma.readingList.findMany({
    where: { userId },
    include: {
      story: {
        include: {
          author:  { select: { username: true, avatarColor: true } },
          _count:  { select: { chapters: true } },
          ratings: { select: { rating: true } },
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  })

  // Batch read chapter counts per story
  const storyIds = entries.map(e => e.storyId)
  const readCounts = await Promise.all(
    storyIds.map(sid => prisma.readChapter.count({ where: { userId, storyId: sid } }))
  )
  const readCountByStory: Record<number, number> = {}
  storyIds.forEach((sid, i) => { readCountByStory[sid] = readCounts[i] })

  return Response.json(entries.map(e => ({
    id:               e.story.id,
    title:            e.story.title,
    description:      e.story.description,
    genre:            e.story.genre,
    authorId:         e.story.authorId,
    authorName:       e.story.author.username,
    authorColor:      e.story.author.avatarColor,
    status:           e.story.status,
    coverColor:       e.story.coverColor,
    tags:             e.story.tags,
    createdAt:        e.story.createdAt,
    updatedAt:        e.story.updatedAt,
    readingStatus:    e.status,
    chapterCount:     e.story._count.chapters,
    readChapterCount: readCountByStory[e.storyId] ?? 0,
    avgRating:        e.story.ratings.length
      ? e.story.ratings.reduce((a, r) => a + r.rating, 0) / e.story.ratings.length
      : null,
    ratingCount: e.story.ratings.length,
  })))
}
