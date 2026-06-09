import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) }, select: { isAdmin: true } })
  return user?.isAdmin ? session : null
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const featured = await prisma.featuredStory.findMany({
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    include: { story: { select: { title: true, coverColor: true } } },
  })
  return Response.json(featured)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const addedById = Number(session.user.id)
  const { storyId, category = 'staff_pick', displayOrder = 0, expiresAt } = await req.json()
  if (!storyId) return Response.json({ error: 'storyId required' }, { status: 400 })

  const story = await prisma.story.findUnique({ where: { id: Number(storyId) }, select: { id: true } })
  if (!story) return Response.json({ error: 'Story not found' }, { status: 404 })

  const entry = await prisma.featuredStory.upsert({
    where: { storyId_category: { storyId: Number(storyId), category } },
    create: {
      storyId: Number(storyId),
      category,
      displayOrder: Number(displayOrder),
      addedById,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    update: {
      displayOrder: Number(displayOrder),
      addedById,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })
  return Response.json(entry, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  await prisma.featuredStory.delete({ where: { id: Number(id) } })
  return new Response(null, { status: 204 })
}
