import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const { storyId } = await req.json()

  const existing = await prisma.readingList.findUnique({
    where: { userId_storyId: { userId, storyId } },
  })

  if (existing) {
    await prisma.readingList.delete({ where: { userId_storyId: { userId, storyId } } })
    return Response.json({ action: 'removed' })
  } else {
    await prisma.readingList.create({ data: { userId, storyId, status: 'want_to_read' } })
    return Response.json({ action: 'added' })
  }
}
