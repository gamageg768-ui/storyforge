import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkAchievements } from '@/lib/achievements'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const genre       = searchParams.get('genre')
  const search      = searchParams.get('search')
  const tag         = searchParams.get('tag')
  const sort        = searchParams.get('sort') || 'recent'
  const page        = Number(searchParams.get('page') || 1)
  const adult       = searchParams.get('adult') === 'true'
  const status      = searchParams.get('status')
  const minRating   = searchParams.get('minRating')   ? Number(searchParams.get('minRating'))   : null
  const maxRating   = searchParams.get('maxRating')   ? Number(searchParams.get('maxRating'))   : null
  const minChapters = searchParams.get('minChapters') ? Number(searchParams.get('minChapters')) : null
  const maxChapters = searchParams.get('maxChapters') ? Number(searchParams.get('maxChapters')) : null

  const where: any = {}
  if (!adult) where.isAdult = false
  if (genre && genre !== 'All') where.genre = genre
  if (status) where.status = status
  if (tag) where.tags = { contains: tag, mode: 'insensitive' }

  if (search) {
    const matchingAuthors = await prisma.user.findMany({
      where: { username: { contains: search, mode: 'insensitive' } },
      select: { id: true },
    })
    const authorIds = matchingAuthors.map(u => u.id)
    where.OR = [
      { title:       { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags:        { contains: search, mode: 'insensitive' } },
      ...(authorIds.length > 0 ? [{ authorId: { in: authorIds } }] : []),
    ]
  }

  const sortMap: any = {
    recent:    { updatedAt: 'desc' },
    new:       { createdAt: 'desc' },
    popular:   { reactions: { _count: 'desc' } },
    top_rated: { createdAt: 'desc' },
  }

  const [stories, total] = await Promise.all([
    prisma.story.findMany({
      where,
      include: {
        author:  { select: { username: true, avatarColor: true } },
        _count:  { select: { chapters: true, reactions: true, comments: true, ratings: true } },
        ratings: { select: { rating: true } },
      },
      orderBy: sortMap[sort] || { updatedAt: 'desc' },
      skip:  (page - 1) * 12,
      take:  12,
    }),
    prisma.story.count({ where }),
  ])

  let result = stories.map(s => {
    const avgRating = s.ratings.length
      ? s.ratings.reduce((a, r) => a + r.rating, 0) / s.ratings.length
      : null
    return {
      id:              s.id,
      title:           s.title,
      description:     s.description,
      genre:           s.genre,
      authorId:        s.authorId,
      authorName:      s.author.username,
      authorColor:     s.author.avatarColor,
      status:          s.status,
      coverColor:      s.coverColor,
      coverImage:      s.coverImage,
      isAdult:         s.isAdult,
      contentWarnings: s.contentWarnings,
      tags:            s.tags,
      createdAt:       s.createdAt,
      updatedAt:       s.updatedAt,
      chapterCount:    s._count.chapters,
      reactionCount:   s._count.reactions,
      commentCount:    s._count.comments,
      avgRating,
      ratingCount:     s._count.ratings,
    }
  })

  if (sort === 'top_rated') {
    result = result.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
  }

  // Apply JS-level post-filters for rating range and chapter count
  if (minRating !== null) result = result.filter(s => (s.avgRating ?? 0) >= minRating)
  if (maxRating !== null) result = result.filter(s => (s.avgRating ?? 0) <= maxRating)
  if (minChapters !== null) result = result.filter(s => (s.chapterCount ?? 0) >= minChapters)
  if (maxChapters !== null) result = result.filter(s => (s.chapterCount ?? 0) <= maxChapters)

  return Response.json({ stories: result, total: result.length, page, totalPages: Math.ceil(result.length / 12) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { title, description, genre, status, coverColor, coverImage, isAdult, contentWarnings, tags } = await req.json()
  if (!title) return Response.json({ error: 'Title is required' }, { status: 400 })

  const story = await prisma.story.create({
    data: {
      title,
      description:     description || '',
      genre:           genre || 'General',
      authorId:        userId,
      status:          status || 'ongoing',
      coverColor:      coverColor || '#6366f1',
      coverImage:      coverImage || null,
      isAdult:         !!isAdult,
      contentWarnings: contentWarnings || '',
      tags:            tags || '',
    },
  })

  await prisma.storyCollaborator.create({
    data: { storyId: story.id, userId, role: 'author' },
  })

  checkAchievements(userId).catch(() => {})

  return Response.json(story, { status: 201 })
}
