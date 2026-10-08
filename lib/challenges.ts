import { prisma } from '@/lib/prisma'

export async function updateChallengeProgress(userId: number, type: 'chapters' | 'stories') {
  const now = new Date()

  const entries = await prisma.challengeEntry.findMany({
    where: { userId, challenge: { goalType: type, startDate: { lte: now }, endDate: { gte: now } } },
    include: { challenge: true },
  })

  for (const entry of entries) {
    let progress = 0

    if (type === 'chapters') {
      progress = await prisma.readChapter.count({
        where: {
          userId,
          completedAt: { gte: entry.challenge.startDate, lte: entry.challenge.endDate },
        },
      })
    } else {
      const distinctStories = await prisma.readChapter.groupBy({
        by: ['storyId'],
        where: {
          userId,
          completedAt: { gte: entry.challenge.startDate, lte: entry.challenge.endDate },
        },
      })
      progress = distinctStories.length
    }

    await prisma.challengeEntry.update({
      where: { id: entry.id },
      data: { progress },
    })
  }
}
