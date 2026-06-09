import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { storyId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const storyId = Number(params.storyId)

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story || story.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { username, role } = await req.json()
  const target = await prisma.user.findUnique({ where: { username } })
  if (!target) return Response.json({ error: 'User not found' }, { status: 404 })

  const collab = await prisma.storyCollaborator.upsert({
    where:  { storyId_userId: { storyId, userId: target.id } },
    update: { role: role || 'author' },
    create: { storyId, userId: target.id, role: role || 'author' },
  })

  return Response.json(collab, { status: 201 })
}
