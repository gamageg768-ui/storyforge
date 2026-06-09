import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const id = Number(params.id)

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification || notification.userId !== userId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } })
  return Response.json({ success: true })
}
