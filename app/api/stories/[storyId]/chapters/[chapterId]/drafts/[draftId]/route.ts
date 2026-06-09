import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(
  _req: Request,
  { params }: { params: { storyId: string; chapterId: string; draftId: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId    = Number(session.user.id)
  const storyId   = Number(params.storyId)
  const chapterId = Number(params.chapterId)
  const draftId   = Number(params.draftId)

  const collab = await prisma.storyCollaborator.findUnique({
    where: { storyId_userId: { storyId, userId } },
  })
  if (!collab) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Only delete drafts that belong to this chapter and author
  await prisma.chapterDraft.deleteMany({
    where: { id: draftId, chapterId, authorId: userId },
  })

  return new Response(null, { status: 204 })
}
