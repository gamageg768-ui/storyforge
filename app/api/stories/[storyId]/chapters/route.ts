import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkAchievements } from '@/lib/achievements'
import { sendChapterNotifications } from '@/lib/notifications'

export async function POST(req: Request, { params }: { params: { storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)

  const collab = await prisma.storyCollaborator.findUnique({
    where: { storyId_userId: { storyId, userId } },
  })
  if (!collab) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { title, content, summary = '', isPublished = true, publishAt } = await req.json()
  if (!title || !content) return Response.json({ error: 'Title and content required' }, { status: 400 })

  const lastChapter = await prisma.chapter.findFirst({
    where: { storyId }, orderBy: { chapterOrder: 'desc' },
  })
  const chapterOrder = (lastChapter?.chapterOrder ?? 0) + 1

  const scheduledAt = publishAt ? new Date(publishAt) : null
  const effectivePublished = scheduledAt && scheduledAt > new Date() ? false : !!isPublished

  const chapter = await prisma.chapter.create({
    data: {
      storyId, title, content, summary, chapterOrder, authorId: userId,
      isPublished: effectivePublished,
      publishAt: scheduledAt,
    },
  })

  await prisma.story.update({ where: { id: storyId }, data: { updatedAt: new Date() } })

  // Notify followers when a chapter is published immediately
  if (effectivePublished) {
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { title: true } })
    if (story) {
      sendChapterNotifications({
        authorId:     userId,
        storyId,
        storyTitle:   story.title,
        chapterId:    chapter.id,
        chapterTitle: chapter.title,
      }).catch(() => {})
    }
  }

  checkAchievements(userId).catch(() => {})

  return Response.json(chapter, { status: 201 })
}
