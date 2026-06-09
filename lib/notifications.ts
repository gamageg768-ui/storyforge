import { prisma } from '@/lib/prisma'
import { sendNewChapterEmail } from '@/lib/email'

export async function sendChapterNotifications(opts: {
  authorId:     number
  storyId:      number
  storyTitle:   string
  chapterId:    number
  chapterTitle: string
}) {
  const { authorId, storyId, storyTitle, chapterId, chapterTitle } = opts

  const [followers, author] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: authorId },
      include: {
        follower: {
          select: {
            id: true, email: true,
            notificationPreferences: {
              where: { type: 'new_chapter' },
              select: { emailEnabled: true, inAppEnabled: true },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: authorId }, select: { username: true } }),
  ])

  if (!followers.length || !author) return

  // Determine who gets in-app vs email notifications
  const inAppRecipients: number[] = []
  const emailRecipients: { id: number; email: string }[] = []

  for (const f of followers) {
    const pref = f.follower.notificationPreferences[0]
    // Default to enabled when no preference row exists
    const inApp = pref ? pref.inAppEnabled : true
    const email  = pref ? pref.emailEnabled  : true

    if (inApp) inAppRecipients.push(f.follower.id)
    if (email && f.follower.email) emailRecipients.push({ id: f.follower.id, email: f.follower.email })
  }

  // Create in-app notifications in batch
  if (inAppRecipients.length > 0) {
    await prisma.notification.createMany({
      data: inAppRecipients.map(userId => ({
        userId,
        type:      'new_chapter',
        actorId:   authorId,
        actorName: author.username,
        storyId,
        chapterId,
        message:   `${author.username} published a new chapter in "${storyTitle}"`,
      })),
      skipDuplicates: true,
    })
  }

  // Fire-and-forget emails — swallow individual failures
  for (const { email } of emailRecipients) {
    sendNewChapterEmail({
      to:           email,
      authorName:   author.username,
      storyTitle,
      chapterTitle,
      chapterId,
      storyId,
    }).catch(() => {})
  }
}
