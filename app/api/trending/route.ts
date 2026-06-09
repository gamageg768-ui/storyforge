import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'week'
  const sort   = searchParams.get('sort')   || 'views'

  const cutoffMap: Record<string, Date | null> = {
    week:  new Date(Date.now() - 7  * 24 * 60 * 60 * 1000),
    month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    all:   null,
  }
  const cutoff = cutoffMap[period] ?? cutoffMap.week

  let storyScores: { storyId: number; score: number }[] = []

  if (sort === 'views') {
    const viewFilter: any = {}
    if (cutoff) viewFilter.viewedAt = { gte: cutoff }

    const viewData = await prisma.chapterView.groupBy({
      by:    ['chapterId'],
      _count: { id: true },
      where:  viewFilter,
    })

    // Map chapterId → storyId
    const chapterIds = viewData.map(v => v.chapterId)
    if (chapterIds.length === 0) return Response.json([])

    const chapters = await prisma.chapter.findMany({
      where:  { id: { in: chapterIds } },
      select: { id: true, storyId: true },
    })
    const chapterToStory = Object.fromEntries(chapters.map(c => [c.id, c.storyId]))

    const storyViewMap: Record<number, number> = {}
    for (const v of viewData) {
      const sid = chapterToStory[v.chapterId]
      if (sid) storyViewMap[sid] = (storyViewMap[sid] ?? 0) + v._count.id
    }
    storyScores = Object.entries(storyViewMap).map(([id, score]) => ({ storyId: Number(id), score }))

  } else if (sort === 'reactions') {
    const reactionFilter: any = { targetType: 'story' }
    if (cutoff) reactionFilter.createdAt = { gte: cutoff }

    const reactionData = await prisma.reaction.groupBy({
      by:    ['targetId'],
      _count: { id: true },
      where:  reactionFilter,
    })
    storyScores = reactionData.map(r => ({ storyId: r.targetId, score: r._count.id }))

  } else if (sort === 'rating') {
    const ratingData = await prisma.rating.groupBy({
      by:     ['storyId'],
      _avg:   { rating: true },
      _count: { id: true },
      having: { rating: { _count: { gte: 1 } } },
    })
    storyScores = ratingData.map(r => ({ storyId: r.storyId, score: r._avg.rating ?? 0 }))
  }

  storyScores.sort((a, b) => b.score - a.score)
  const top20 = storyScores.slice(0, 20)
  if (top20.length === 0) return Response.json([])

  const storyIds = top20.map(s => s.storyId)
  const stories  = await prisma.story.findMany({
    where:   { id: { in: storyIds }, isAdult: false },
    include: {
      author:  { select: { username: true, avatarColor: true } },
      _count:  { select: { chapters: true, reactions: true, ratings: true } },
      ratings: { select: { rating: true } },
    },
  })

  const storyMap = Object.fromEntries(stories.map(s => [s.id, s]))
  const result   = top20
    .filter(item => storyMap[item.storyId])
    .map((item, idx) => {
      const s = storyMap[item.storyId]
      const avgRating = s.ratings.length
        ? s.ratings.reduce((a, r) => a + r.rating, 0) / s.ratings.length
        : null
      return {
        rank:         idx + 1,
        score:        item.score,
        id:           s.id,
        title:        s.title,
        description:  s.description,
        genre:        s.genre,
        authorId:     s.authorId,
        authorName:   s.author.username,
        authorColor:  s.author.avatarColor,
        status:       s.status,
        coverColor:   s.coverColor,
        coverImage:   s.coverImage,
        tags:         s.tags,
        createdAt:    s.createdAt,
        updatedAt:    s.updatedAt,
        chapterCount: s._count.chapters,
        reactionCount: s._count.reactions,
        ratingCount:  s._count.ratings,
        avgRating,
      }
    })

  return Response.json(result)
}
