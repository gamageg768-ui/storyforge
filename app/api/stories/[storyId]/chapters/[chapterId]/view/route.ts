import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkAchievements } from '@/lib/achievements'

export async function POST(_req: Request, { params }: { params: { storyId: string; chapterId: string } }) {
  const chapterId = Number(params.chapterId)
  const session   = await auth()
  const userId    = session?.user?.id ? Number(session.user.id) : null

  // Deduplicate: same user + chapter within 1 hour
  if (userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recent = await prisma.chapterView.findFirst({
      where: { chapterId, userId, viewedAt: { gte: oneHourAgo } },
    })
    if (recent) return Response.json({ counted: false })
  }

  await prisma.chapterView.create({ data: { chapterId, userId } })

  // Check view-count achievements for the chapter's author
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { authorId: true } })
  if (chapter) checkAchievements(chapter.authorId).catch(() => {})

  return Response.json({ counted: true })
}
