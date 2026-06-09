import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { storyId: string; chapterId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId    = Number(session.user.id)
  const storyId   = Number(params.storyId)
  const chapterId = Number(params.chapterId)

  const collab = await prisma.storyCollaborator.findUnique({
    where: { storyId_userId: { storyId, userId } },
  })
  if (!collab) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const drafts = await prisma.chapterDraft.findMany({
    where:   { chapterId },
    orderBy: { savedAt: 'desc' },
    take:    20,
    select:  { id: true, title: true, content: true, savedAt: true },
  })

  return Response.json(drafts)
}

export async function POST(req: Request, { params }: { params: { storyId: string; chapterId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId    = Number(session.user.id)
  const storyId   = Number(params.storyId)
  const chapterId = Number(params.chapterId)

  const collab = await prisma.storyCollaborator.findUnique({
    where: { storyId_userId: { storyId, userId } },
  })
  if (!collab) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { title, content } = await req.json()
  if (!title || !content) return Response.json({ error: 'Title and content required' }, { status: 400 })

  const draft = await prisma.chapterDraft.create({
    data: { chapterId, authorId: userId, title, content },
  })

  // Keep only the 20 most recent drafts for this chapter
  const all = await prisma.chapterDraft.findMany({
    where:   { chapterId },
    orderBy: { savedAt: 'desc' },
    select:  { id: true },
  })
  if (all.length > 20) {
    const toDelete = all.slice(20).map(d => d.id)
    await prisma.chapterDraft.deleteMany({ where: { id: { in: toDelete } } })
  }

  return Response.json(draft, { status: 201 })
}
