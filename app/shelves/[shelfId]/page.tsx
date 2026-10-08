import { notFound } from 'next/navigation'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'

async function getShelf(shelfId: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/shelves/${shelfId}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ShelfPage({ params }: { params: { shelfId: string } }) {
  const shelf = await getShelf(params.shelfId)
  if (!shelf) notFound()

  const stories = shelf.stories.map((ss: any) => {
    const s = ss.story
    return {
      ...s,
      authorName:   s.author?.username ?? '',
      authorColor:  s.author?.avatarColor ?? '#6366f1',
      chapterCount: s._count?.chapters ?? 0,
      reactionCount: s._count?.reactions ?? 0,
      avgRating: s.ratings?.length
        ? s.ratings.reduce((a: number, r: any) => a + r.rating, 0) / s.ratings.length
        : null,
    }
  })

  return (
    <div className="min-h-screen bg-gray-950 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/shelves" className="text-sm text-gray-500 hover:text-gray-300 transition">← My Shelves</Link>
          <h1 className="text-3xl font-playfair font-bold text-white mt-3">{shelf.title}</h1>
          {shelf.description && <p className="text-gray-400 mt-1">{shelf.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
            <span>by <Link href={`/profile/${shelf.user.username}`} className="text-indigo-400 hover:underline">{shelf.user.username}</Link></span>
            <span>·</span>
            <span>{shelf._count.stories} {shelf._count.stories === 1 ? 'story' : 'stories'}</span>
            <span>·</span>
            <span>{shelf.isPublic ? '🌐 Public' : '🔒 Private'}</span>
          </div>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">📭</p>
            <p>No stories on this shelf yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stories.map((s: any) => <StoryCard key={s.id} story={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
