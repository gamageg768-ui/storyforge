import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { seriesId: string } }) {
  const seriesId = Number(params.seriesId)

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      author: { select: { id: true, username: true, avatarColor: true } },
      stories: {
        include: {
          story: {
            include: {
              author: { select: { username: true, avatarColor: true } },
              _count: { select: { chapters: true, reactions: true } },
              ratings: { select: { rating: true } },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!series) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(series)
}

export async function PUT(req: Request, { params }: { params: { seriesId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const seriesId = Number(params.seriesId)

  const series = await prisma.series.findUnique({ where: { id: seriesId } })
  if (!series) return Response.json({ error: 'Not found' }, { status: 404 })
  if (series.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description } = await req.json()
  const updated = await prisma.series.update({
    where: { id: seriesId },
    data: { title: title?.trim(), description: description?.trim() ?? '' },
  })
  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { seriesId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const seriesId = Number(params.seriesId)

  const series = await prisma.series.findUnique({ where: { id: seriesId } })
  if (!series) return Response.json({ error: 'Not found' }, { status: 404 })
  if (series.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.series.delete({ where: { id: seriesId } })
  return Response.json({ success: true })
}
