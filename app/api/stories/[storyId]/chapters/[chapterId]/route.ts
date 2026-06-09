import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendChapterNotifications } from '@/lib/notifications'

export async function GET(req: Request, { params }: { params: { storyId: string; chapterId: string } }) {
  const storyId   = Number(params.storyId)
  const chapterId = Number(params.chapterId)
  const session   = await auth()
  const userId    = session?.user?.id ? Number(session.user.id) : null

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { author: { select: { username: true, avatarColor: true } } },
  })
  if (!chapter || chapter.storyId !== storyId) return Response.json({ error: 'Not found' }, { status: 404 })

  // Block unpublished/scheduled chapters for non-collaborators
  const isScheduled = chapter.publishAt && chapter.publishAt > new Date()
  if (!chapter.isPublished || isScheduled) {
    const collab = userId
      ? await prisma.storyCollaborator.findUnique({
          where: { storyId_userId: { storyId, userId } },
        })
      : null
    if (!collab) return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const prev = await prisma.chapter.findFirst({
    where: { storyId, chapterOrder: chapter.chapterOrder - 1, isPublished: true },
    select: { id: true, title: true },
  })
  const next = await prisma.chapter.findFirst({
    where: {
      storyId, chapterOrder: chapter.chapterOrder + 1,
      isPublished: true, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
    },
    select: { id: true, title: true },
  })

  return Response.json({
    id:           chapter.id,
    storyId:      chapter.storyId,
    title:        chapter.title,
    content:      chapter.content,
    chapterOrder: chapter.chapterOrder,
    authorId:     chapter.authorId,
    authorName:   chapter.author.username,
    avatarColor:  chapter.author.avatarColor,
    isPublished:  chapter.isPublished,
    publishAt:    chapter.publishAt,
    createdAt:    chapter.createdAt,
    prevChapter:  prev ?? null,
    nextChapter:  next ?? null,
  })
}

export async function PUT(req: Request, { params }: { params: { storyId: string; chapterId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId    = Number(session.user.id)
  const storyId   = Number(params.storyId)
  const chapterId = Number(params.chapterId)

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!chapter || chapter.storyId !== storyId) return Response.json({ error: 'Not found' }, { status: 404 })

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (chapter.authorId !== userId && story?.authorId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content, isPublished, publishAt, summary } = await req.json()
  const scheduledAt = publishAt !== undefined ? (publishAt ? new Date(publishAt) : null) : undefined

  const wasPublished = chapter.isPublished
  const updated = await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      title, content,
      ...(isPublished !== undefined && { isPublished: !!isPublished }),
      ...(scheduledAt !== undefined && { publishAt: scheduledAt }),
      ...(summary     !== undefined && { summary }),
    },
  })

  // Fire notifications when transitioning from unpublished → published
  const nowPublished = isPublished !== undefined ? !!isPublished : wasPublished
  if (!wasPublished && nowPublished) {
    const storyRecord = await prisma.story.findUnique({ where: { id: storyId }, select: { title: true } })
    if (storyRecord) {
      sendChapterNotifications({
        authorId:     userId,
        storyId,
        storyTitle:   storyRecord.title,
        chapterId,
        chapterTitle: updated.title,
      }).catch(() => {})
    }
  }

  return Response.json(updated)
}
