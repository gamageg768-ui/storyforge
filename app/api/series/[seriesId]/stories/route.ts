import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { seriesId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const seriesId = Number(params.seriesId)

  const series = await prisma.series.findUnique({ where: { id: seriesId } })
  if (!series) return Response.json({ error: 'Not found' }, { status: 404 })
  if (series.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { storyId, order } = await req.json()
  if (!storyId) return Response.json({ error: 'storyId required' }, { status: 400 })

  const last = await prisma.seriesStory.findFirst({ where: { seriesId }, orderBy: { order: 'desc' } })
  const nextOrder = order ?? (last?.order ?? 0) + 1

  const entry = await prisma.seriesStory.upsert({
    where: { seriesId_storyId: { seriesId, storyId: Number(storyId) } },
    create: { seriesId, storyId: Number(storyId), order: nextOrder },
    update: { order: nextOrder },
  })
  return Response.json(entry, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: { seriesId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const seriesId = Number(params.seriesId)

  const series = await prisma.series.findUnique({ where: { id: seriesId } })
  if (!series) return Response.json({ error: 'Not found' }, { status: 404 })
  if (series.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { storyId } = await req.json()
  await prisma.seriesStory.deleteMany({ where: { seriesId, storyId: Number(storyId) } })
  return Response.json({ success: true })
}
