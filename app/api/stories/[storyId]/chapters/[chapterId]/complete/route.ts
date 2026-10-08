import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateChallengeProgress } from '@/lib/challenges'

export async function POST(
  _req: Request,
  { params }: { params: { storyId: string; chapterId: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId    = Number(session.user.id)
  const chapterId = Number(params.chapterId)
  const storyId   = Number(params.storyId)

  await prisma.readChapter.upsert({
    where:  { userId_chapterId: { userId, chapterId } },
    update: { completedAt: new Date() },
    create: { userId, chapterId, storyId },
  })

  // Update any active reading challenges (fire-and-forget)
  updateChallengeProgress(userId, 'chapters').catch(() => {})
  updateChallengeProgress(userId, 'stories').catch(() => {})

  return Response.json({ completed: true })
}
