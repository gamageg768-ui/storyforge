import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json([], { status: 200 })
  const userId = Number(session.user.id)

  // Find stories the user is actively reading
  const readingEntries = await prisma.readingList.findMany({
    where: { userId, status: 'reading' },
    include: {
      story: {
        include: {
          chapters: {
            where: { isPublished: true, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
            orderBy: { chapterOrder: 'asc' },
            select: { id: true, title: true, chapterOrder: true },
          },
        },
      },
    },
    take: 5,
  })

  if (readingEntries.length === 0) return Response.json([])

  const storyIds = readingEntries.map(e => e.storyId)

  // Find last-read chapter per story
  const readChapters = await prisma.readChapter.findMany({
    where: { userId, storyId: { in: storyIds } },
    orderBy: { completedAt: 'desc' },
  })

  const lastReadByStory: Record<number, number> = {}
  for (const rc of readChapters) {
    if (!lastReadByStory[rc.storyId]) lastReadByStory[rc.storyId] = rc.chapterId
  }

  const readCountByStory: Record<number, number> = {}
  for (const rc of readChapters) {
    readCountByStory[rc.storyId] = (readCountByStory[rc.storyId] ?? 0) + 1
  }

  // Deduplicate read count
  const distinctReadCount = await Promise.all(
    storyIds.map(async storyId => {
      const count = await prisma.readChapter.count({ where: { userId, storyId } })
      return { storyId, count }
    })
  )
  const readCountMap: Record<number, number> = {}
  for (const { storyId, count } of distinctReadCount) readCountMap[storyId] = count

  const result = []

  for (const entry of readingEntries) {
    const story = entry.story
    const chapters = story.chapters
    if (chapters.length === 0) continue

    const lastChapterId = lastReadByStory[story.id]
    let nextChapter = chapters[0] // default: first chapter

    if (lastChapterId) {
      const lastChapter = chapters.find(c => c.id === lastChapterId)
      if (lastChapter) {
        // Find the chapter after the last-read one
        const next = chapters.find(c => c.chapterOrder > lastChapter.chapterOrder)
        if (next) {
          nextChapter = next
        } else {
          // All chapters read — skip this story
          continue
        }
      }
    }

    result.push({
      storyId:          story.id,
      storyTitle:       story.title,
      coverColor:       story.coverColor,
      coverImage:       (story as any).coverImage ?? null,
      readCount:        readCountMap[story.id] ?? 0,
      totalChapters:    chapters.length,
      nextChapterId:    nextChapter.id,
      nextChapterTitle: nextChapter.title,
      nextChapterOrder: nextChapter.chapterOrder,
    })

    if (result.length >= 3) break
  }

  return Response.json(result)
}
