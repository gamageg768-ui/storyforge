import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkAchievements } from '@/lib/achievements'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { content, storyId, chapterId, parentId, paragraphIndex, selectedText } = await req.json()
  if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 })

  const comment = await prisma.comment.create({
    data: {
      userId,
      content:        content.trim(),
      storyId:        storyId        ?? null,
      chapterId:      chapterId      ?? null,
      parentId:       parentId       ?? null,
      paragraphIndex: paragraphIndex ?? null,
      selectedText:   selectedText   ?? null,
    },
    include: { user: { select: { username: true, avatarColor: true } } },
  })

  // Notify story author (if not commenting on own story)
  if (storyId) {
    const story = await prisma.story.findUnique({
      where: { id: storyId }, select: { authorId: true, title: true },
    })
    if (story && story.authorId !== userId) {
      const actor = await prisma.user.findUnique({
        where: { id: userId }, select: { username: true },
      })
      if (actor) {
        await prisma.notification.create({
          data: {
            userId:    story.authorId,
            type:      'new_comment',
            actorId:   userId,
            actorName: actor.username,
            storyId,
            message:   `${actor.username} commented on "${story.title}"`,
          },
        })
        checkAchievements(story.authorId).catch(() => {})
      }
    }
  }

  return Response.json({
    id:             comment.id,
    userId:         comment.userId,
    username:       comment.user.username,
    avatarColor:    comment.user.avatarColor,
    content:        comment.content,
    parentId:       comment.parentId,
    paragraphIndex: comment.paragraphIndex,
    selectedText:   comment.selectedText,
    createdAt:      comment.createdAt,
    replies:        [],
  }, { status: 201 })
}
