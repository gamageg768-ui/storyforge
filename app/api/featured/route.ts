import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()
  const featured = await prisma.featuredStory.findMany({
    where: { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    include: {
      story: {
        include: {
          author: { select: { username: true, avatarColor: true } },
          ratings: { select: { rating: true } },
          _count:  { select: { reactions: true, comments: true } },
          chapters: { where: { isPublished: true }, select: { id: true } },
        },
      },
    },
  })

  return Response.json(featured.map(f => ({
    featuredId:    f.id,
    category:      f.category,
    displayOrder:  f.displayOrder,
    story: {
      id:           f.story.id,
      title:        f.story.title,
      description:  f.story.description,
      genre:        f.story.genre,
      authorId:     f.story.authorId,
      authorName:   f.story.author.username,
      authorColor:  f.story.author.avatarColor,
      status:       f.story.status,
      coverColor:   f.story.coverColor,
      coverImage:   f.story.coverImage,
      tags:         f.story.tags,
      createdAt:    f.story.createdAt,
      updatedAt:    f.story.updatedAt,
      chapterCount: f.story.chapters.length,
      reactionCount: f.story._count.reactions,
      commentCount:  f.story._count.comments,
      avgRating:    f.story.ratings.length
        ? f.story.ratings.reduce((a, r) => a + r.rating, 0) / f.story.ratings.length
        : null,
      ratingCount:  f.story.ratings.length,
    },
  })))
}
