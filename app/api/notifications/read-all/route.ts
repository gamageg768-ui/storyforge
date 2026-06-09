import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  return Response.json({ success: true })
}
