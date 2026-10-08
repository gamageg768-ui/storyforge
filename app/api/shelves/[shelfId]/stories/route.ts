import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { shelfId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const shelfId = Number(params.shelfId)

  const shelf = await prisma.shelf.findUnique({ where: { id: shelfId }, select: { userId: true } })
  if (!shelf || shelf.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  const { storyId } = await req.json()
  if (!storyId) return Response.json({ error: 'storyId required' }, { status: 400 })

  await prisma.shelfStory.upsert({
    where:  { shelfId_storyId: { shelfId, storyId: Number(storyId) } },
    create: { shelfId, storyId: Number(storyId) },
    update: {},
  })

  await prisma.shelf.update({ where: { id: shelfId }, data: { updatedAt: new Date() } })

  return Response.json({ success: true })
}
