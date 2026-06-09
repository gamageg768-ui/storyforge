import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authorId = searchParams.get('authorId')

  const series = await prisma.series.findMany({
    where: authorId ? { authorId: Number(authorId) } : undefined,
    include: {
      author: { select: { id: true, username: true, avatarColor: true } },
      stories: {
        include: { story: { select: { id: true, title: true, coverColor: true, coverImage: true, genre: true } } },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(series)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { title, description } = await req.json()
  if (!title?.trim()) return Response.json({ error: 'Title is required' }, { status: 400 })

  const series = await prisma.series.create({
    data: { title: title.trim(), description: description?.trim() || '', authorId: userId },
  })

  return Response.json(series, { status: 201 })
}
