import { prisma } from './prisma'

export const ACHIEVEMENTS: Record<string, { name: string; desc: string; icon: string }> = {
  first_story:        { name: 'First Story',         desc: 'Published your first story',        icon: '✍' },
  five_stories:       { name: 'Storyteller',          desc: 'Published 5 stories',               icon: '📚' },
  ten_stories:        { name: 'Prolific Author',      desc: 'Published 10 stories',              icon: '🏛' },
  ten_chapters:       { name: 'Prolific Writer',      desc: 'Published 10 chapters total',       icon: '📜' },
  fifty_chapters:     { name: 'Chapter Master',       desc: 'Published 50 chapters total',       icon: '📖' },
  hundred_views:      { name: 'Rising Star',          desc: '100 total chapter views',           icon: '⭐' },
  thousand_views:     { name: 'Popular Author',       desc: '1,000 total chapter views',         icon: '🌟' },
  ten_thousand_views: { name: 'Sensation',            desc: '10,000 total chapter views',        icon: '💫' },
  first_follower:     { name: 'First Fan',            desc: 'Got your first follower',           icon: '❤' },
  ten_followers:      { name: 'Growing Audience',     desc: 'Reached 10 followers',              icon: '👥' },
  fifty_followers:    { name: 'Community Builder',    desc: 'Reached 50 followers',              icon: '🏆' },
  five_star:          { name: 'Critically Acclaimed', desc: 'Received a 5-star rating',          icon: '⭐' },
  first_comment:      { name: 'Conversation Starter', desc: 'Received your first comment',       icon: '💬' },
  beloved:            { name: 'Beloved',              desc: 'Received 50 reactions on a story',  icon: '❤' },
}

export async function checkAchievements(userId: number): Promise<void> {
  const toAward: string[] = []

  const [storyCount, totalChapters, totalViews, followerCount, ratingData, commentCount, reactionData] =
    await Promise.all([
      prisma.story.count({ where: { authorId: userId } }),
      prisma.chapter.count({ where: { authorId: userId } }),
      prisma.chapterView.count({
        where: { chapter: { authorId: userId } },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.rating.findFirst({ where: { story: { authorId: userId }, rating: 5 } }),
      prisma.comment.count({ where: { story: { authorId: userId }, parentId: null } }),
      prisma.reaction.groupBy({
        by:     ['targetId'],
        _count: { id: true },
        where:  { targetType: 'story', story: { authorId: userId } },
        having: { id: { _count: { gte: 50 } } },
      }),
    ])

  if (storyCount >= 1)   toAward.push('first_story')
  if (storyCount >= 5)   toAward.push('five_stories')
  if (storyCount >= 10)  toAward.push('ten_stories')
  if (totalChapters >= 10)  toAward.push('ten_chapters')
  if (totalChapters >= 50)  toAward.push('fifty_chapters')
  if (totalViews >= 100)    toAward.push('hundred_views')
  if (totalViews >= 1000)   toAward.push('thousand_views')
  if (totalViews >= 10000)  toAward.push('ten_thousand_views')
  if (followerCount >= 1)   toAward.push('first_follower')
  if (followerCount >= 10)  toAward.push('ten_followers')
  if (followerCount >= 50)  toAward.push('fifty_followers')
  if (ratingData)           toAward.push('five_star')
  if (commentCount >= 1)    toAward.push('first_comment')
  if (reactionData.length > 0) toAward.push('beloved')

  if (toAward.length === 0) return

  await prisma.userAchievement.createMany({
    data:            toAward.map(achievement => ({ userId, achievement })),
    skipDuplicates:  true,
  })
}
