import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkAchievements } from '@/lib/achievements'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const followerId  = Number(session.user.id)
  const { userId: followingId } = await req.json()

  if (followerId === followingId) return Response.json({ error: 'Cannot follow yourself' }, { status: 400 })

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } })
    return Response.json({ action: 'unfollowed' })
  }

  await prisma.follow.create({ data: { followerId, followingId } })

  const actor = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true } })
  if (actor) {
    await prisma.notification.create({
      data: {
        userId:    followingId,
        type:      'new_follower',
        actorId:   followerId,
        actorName: actor.username,
        message:   `${actor.username} started following you`,
      },
    })
  }

  checkAchievements(followingId).catch(() => {})

  return Response.json({ action: 'followed' })
}
