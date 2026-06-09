import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { storyId: string } }) {
  const storyId = Number(params.storyId)
  const session = await auth()
  const userId = session?.user?.id ? Number(session.user.id) : null

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      author:        { select: { id: true, username: true, avatarColor: true } },
      collaborators: { include: { user: { select: { id: true, username: true, avatarColor: true } } } },
      chapters: {
        where: { isPublished: true, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
        orderBy: { chapterOrder: 'asc' },
        include: { author: { select: { username: true } } },
      },
      ratings:     { select: { rating: true, userId: true } },
      readingList: userId ? { where: { userId } } : false,
      reactions:   userId ? { where: { userId, targetType: 'story' } } : false,
    },
  })

  if (!story) return Response.json({ error: 'Not found' }, { status: 404 })

  // Collaborators see all chapters including drafts/scheduled
  const isCollaborator = userId && story.collaborators.some(c => c.user.id === userId)
  let chapters = story.chapters as any[]
  if (isCollaborator) {
    chapters = await prisma.chapter.findMany({
      where: { storyId },
      orderBy: { chapterOrder: 'asc' },
      include: { author: { select: { username: true } } },
    })
  }

  const avgRating = story.ratings.length
    ? story.ratings.reduce((a, r) => a + r.rating, 0) / story.ratings.length
    : null
  const userRating   = userId ? (story.ratings.find(r => r.userId === userId)?.rating ?? null) : null
  const userReaction = userId && Array.isArray(story.reactions) && story.reactions.length > 0
    ? story.reactions[0].reactionType : null
  const inReadingList = userId && Array.isArray(story.readingList) && story.readingList.length > 0

  // Compute word count from published chapters content
  const chapterContents = await prisma.chapter.findMany({
    where: { storyId, isPublished: true, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
    select: { content: true },
  })
  const totalWordCount = chapterContents.reduce((sum, c) => {
    const words = c.content.trim() ? c.content.trim().split(/\s+/).length : 0
    return sum + words
  }, 0)
  const estimatedReadMinutes = Math.ceil(totalWordCount / 200)

  return Response.json({
    id:              story.id,
    title:           story.title,
    description:     story.description,
    genre:           story.genre,
    authorId:        story.authorId,
    authorName:      story.author.username,
    authorColor:     story.author.avatarColor,
    status:          story.status,
    coverColor:      story.coverColor,
    coverImage:      story.coverImage,
    isAdult:         story.isAdult,
    contentWarnings: story.contentWarnings,
    tags:            story.tags,
    createdAt:       story.createdAt,
    updatedAt:       story.updatedAt,
    avgRating,
    ratingCount:     story.ratings.length,
    userRating,
    userReaction,
    inReadingList:   !!inReadingList,
    readingStatus:   Array.isArray(story.readingList) && story.readingList.length > 0
      ? story.readingList[0].status : null,
    chapters: chapters.map(c => ({
      id: c.id, title: c.title, chapterOrder: c.chapterOrder,
      createdAt: c.createdAt, authorName: c.author.username,
      isPublished: c.isPublished, publishAt: c.publishAt,
      summary: c.summary ?? '',
    })),
    totalWordCount,
    estimatedReadMinutes,
    collaborators: story.collaborators.map(c => ({
      id: c.user.id, username: c.user.username, avatarColor: c.user.avatarColor, role: c.role,
    })),
  })
}

export async function PUT(req: Request, { params }: { params: { storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story) return Response.json({ error: 'Not found' }, { status: 404 })
  if (story.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, genre, status, tags, coverImage, isAdult, contentWarnings } = await req.json()
  const updated = await prisma.story.update({
    where: { id: storyId },
    data: {
      title, description, genre, status, tags,
      ...(coverImage !== undefined && { coverImage }),
      ...(isAdult !== undefined && { isAdult: !!isAdult }),
      ...(contentWarnings !== undefined && { contentWarnings }),
    },
  })
  return Response.json(updated)
}

export async function DELETE(req: Request, { params }: { params: { storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story) return Response.json({ error: 'Not found' }, { status: 404 })
  if (story.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { storyId } }),
    prisma.reaction.deleteMany({ where: { targetType: 'story', targetId: storyId } }),
    prisma.rating.deleteMany({ where: { storyId } }),
    prisma.readingList.deleteMany({ where: { storyId } }),
    prisma.storyCollaborator.deleteMany({ where: { storyId } }),
    prisma.seriesStory.deleteMany({ where: { storyId } }),
    prisma.story.delete({ where: { id: storyId } }),
  ])

  return Response.json({ success: true })
}
