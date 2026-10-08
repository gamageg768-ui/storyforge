import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(_req: Request, { params }: { params: { shelfId: string; storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const shelfId = Number(params.shelfId)

  const shelf = await prisma.shelf.findUnique({ where: { id: shelfId }, select: { userId: true } })
  if (!shelf || shelf.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.shelfStory.deleteMany({
    where: { shelfId, storyId: Number(params.storyId) },
  })

  return Response.json({ success: true })
}
