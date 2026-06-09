import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId    = Number(session.user.id)
  const commentId = Number(params.id)

  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  })

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } })
  } else {
    await prisma.commentLike.create({ data: { userId, commentId } })
  }

  const likeCount = await prisma.commentLike.count({ where: { commentId } })
  return Response.json({ action: existing ? 'unliked' : 'liked', likeCount })
}
