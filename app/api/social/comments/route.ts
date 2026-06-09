import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storyId   = searchParams.get('story_id')   ? Number(searchParams.get('story_id'))   : undefined
  const chapterId = searchParams.get('chapter_id') ? Number(searchParams.get('chapter_id')) : undefined

  const session = await auth()
  const userId  = session ? Number(session.user.id) : null

  const comments = await prisma.comment.findMany({
    where: {
      parentId: null,
      ...(storyId   ? { storyId }   : {}),
      ...(chapterId ? { chapterId } : {}),
    },
    include: {
      user:   { select: { username: true, avatarColor: true } },
      _count: { select: { likes: true } },
      ...(userId ? { likes: { where: { userId } } } : {}),
      replies: {
        include: {
          user:   { select: { username: true, avatarColor: true } },
          _count: { select: { likes: true } },
          ...(userId ? { likes: { where: { userId } } } : {}),
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  function mapComment(c: any) {
    return {
      id:             c.id,
      userId:         c.userId,
      username:       c.user.username,
      avatarColor:    c.user.avatarColor,
      content:        c.content,
      parentId:       c.parentId,
      paragraphIndex: c.paragraphIndex,
      selectedText:   c.selectedText,
      likeCount:      c._count?.likes ?? 0,
      userLiked:      userId ? (c.likes?.length ?? 0) > 0 : false,
      createdAt:      c.createdAt,
    }
  }

  return Response.json(comments.map(c => ({
    ...mapComment(c),
    replies: c.replies.map((r: any) => ({ ...mapComment(r), replies: [] })),
  })))
}
