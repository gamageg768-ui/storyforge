import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: { storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)
  const { status } = await req.json()

  const updated = await prisma.readingList.upsert({
    where:  { userId_storyId: { userId, storyId } },
    update: { status },
    create: { userId, storyId, status },
  })
  return Response.json(updated)
}
