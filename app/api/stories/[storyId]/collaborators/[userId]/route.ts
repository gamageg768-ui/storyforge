import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(
  req: Request,
  { params }: { params: { storyId: string; userId: string } }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const currentUser = Number(session.user.id)
  const storyId     = Number(params.storyId)
  const targetUser  = Number(params.userId)

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story || story.authorId !== currentUser) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.storyCollaborator.deleteMany({ where: { storyId, userId: targetUser } })
  return Response.json({ success: true })
}
