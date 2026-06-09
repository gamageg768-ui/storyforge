import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function requireAdmin(session: any) {
  if (!session) return false
  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { isAdmin: true },
  })
  return !!user?.isAdmin
}

export async function GET(req: Request) {
  const session = await auth()
  if (!await requireAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'

  const reports = await prisma.report.findMany({
    where: { status },
    include: { reporter: { select: { id: true, username: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return Response.json(reports)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!await requireAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await req.json()
  if (!id || !['resolved', 'dismissed'].includes(status)) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const report = await prisma.report.update({ where: { id: Number(id) }, data: { status } })
  return Response.json(report)
}
