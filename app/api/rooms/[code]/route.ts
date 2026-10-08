import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const room = await prisma.readingRoom.findUnique({
    where: { code: params.code.toUpperCase() },
    include: {
      participants: {
        include: { user: { select: { id: true, username: true, avatarColor: true } } },
        orderBy: { lastSeen: 'desc' },
      },
      messages: {
        include: { user: { select: { id: true, username: true, avatarColor: true } } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
    },
  })

  if (!room || !room.isActive) return Response.json({ error: 'Room not found or closed' }, { status: 404 })

  // Prune stale participants (no heartbeat in 30s)
  const staleThreshold = new Date(Date.now() - 30_000)
  await prisma.readingRoomParticipant.deleteMany({
    where: { roomId: room.id, userId: { not: room.hostId }, lastSeen: { lt: staleThreshold } },
  })

  // Update requester's lastSeen
  await prisma.readingRoomParticipant.upsert({
    where:  { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId },
    update: { lastSeen: new Date() },
  })

  return Response.json({
    code:     room.code,
    storyId:  room.storyId,
    chapterId: room.chapterId,
    hostId:   room.hostId,
    isActive: room.isActive,
    participants: room.participants.map(p => ({
      userId:          p.userId,
      username:        p.user.username,
      avatarColor:     p.user.avatarColor,
      cursorParagraph: p.cursorParagraph,
      lastSeen:        p.lastSeen,
    })),
    messages: room.messages.map(m => ({
      id:        m.id,
      userId:    m.userId,
      username:  m.user.username,
      avatarColor: m.user.avatarColor,
      content:   m.content,
      createdAt: m.createdAt,
    })),
  })
}
