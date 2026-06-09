import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId    = Number(session.user.id)
  const commentId = Number(params.id)

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) return Response.json({ error: 'Not found' }, { status: 404 })
  if (comment.userId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Delete replies first
  await prisma.comment.deleteMany({ where: { parentId: commentId } })
  await prisma.comment.delete({ where: { id: commentId } })

  return Response.json({ success: true })
}
