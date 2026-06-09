import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _req: Request,
  { params }: { params: { storyId: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ readCount: 0, totalCount: 0, lastReadChapterId: null })

  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)

  const [totalCount, readCount, lastRead] = await Promise.all([
    prisma.chapter.count({ where: { storyId, isPublished: true } }),
    prisma.readChapter.count({ where: { userId, storyId } }),
    prisma.readChapter.findFirst({
      where:   { userId, storyId },
      orderBy: { completedAt: 'desc' },
      select:  { chapterId: true },
    }),
  ])

  return Response.json({
    readCount,
    totalCount,
    lastReadChapterId: lastRead?.chapterId ?? null,
  })
}
