'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Period = 'week' | 'month' | 'all'
type Sort   = 'views' | 'reactions' | 'rating'

interface TrendingStory {
  rank:          number
  score:         number
  id:            number
  title:         string
  description:   string
  genre:         string
  authorId:      number
  authorName:    string
  authorColor:   string
  status:        string
  coverColor:    string
  coverImage:    string | null
  chapterCount:  number
  reactionCount: number
  ratingCount:   number
  avgRating:     number | null
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week',  label: 'This Week'  },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time'   },
]

const SORTS: { key: Sort; label: string; unit: string }[] = [
  { key: 'views',     label: 'Views',     unit: 'views'     },
  { key: 'reactions', label: 'Reactions', unit: 'reactions' },
  { key: 'rating',    label: 'Top Rated', unit: 'avg rating'},
]

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl animate-pulse">
      <div className="w-10 h-10 bg-gray-700 rounded" />
      <div className="w-12 h-16 bg-gray-700 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-700 rounded w-1/3" />
      </div>
      <div className="w-16 h-8 bg-gray-700 rounded" />
    </div>
  )
}

export default function TrendingPage() {
  const [period,  setPeriod]  = useState<Period>('week')
  const [sort,    setSort]    = useState<Sort>('views')
  const [stories, setStories] = useState<TrendingStory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/trending?period=${period}&sort=${sort}`)
    if (res.ok) setStories(await res.json())
    setLoading(false)
  }, [period, sort])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  const sortMeta = SORTS.find(s => s.key === sort)!

  function formatScore(story: TrendingStory) {
    if (sort === 'views')     return `${story.score.toLocaleString()} ${sortMeta.unit}`
    if (sort === 'reactions') return `${story.score.toLocaleString()} ${sortMeta.unit}`
    if (sort === 'rating')    return story.avgRating != null ? `${story.avgRating.toFixed(2)} / 5` : '—'
    return ''
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-playfair text-3xl font-bold text-white mb-1">Trending</h1>
          <p className="text-gray-500 text-sm">The most popular stories on StoryForge</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1 rounded text-sm transition ${
                  period === p.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {SORTS.map(s => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`px-3 py-1 rounded text-sm transition ${
                  sort === s.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : stories.map(story => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition group"
              >
                {/* Rank */}
                <span className={`text-2xl font-bold w-8 text-center shrink-0 ${
                  story.rank === 1 ? 'text-yellow-400' :
                  story.rank === 2 ? 'text-gray-300' :
                  story.rank === 3 ? 'text-amber-600' : 'text-gray-700'
                }`}>
                  {story.rank}
                </span>

                {/* Cover */}
                {story.coverImage ? (
                  <img src={story.coverImage} alt={story.title} className="w-12 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div
                    className="w-12 h-16 rounded-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${story.coverColor}cc, ${story.coverColor}44)` }}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-playfair font-semibold text-white group-hover:text-indigo-300 transition truncate">{story.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: story.authorColor }}
                    >
                      {story.authorName[0].toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-xs truncate">{story.authorName}</span>
                    <span className="text-gray-700 text-xs">&middot;</span>
                    <span className="text-gray-600 text-xs">{story.genre}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-gray-600 text-xs">
                    <span>{story.chapterCount} ch</span>
                    <span>{story.reactionCount} reactions</span>
                    {story.avgRating != null && <span>{story.avgRating.toFixed(1)} stars</span>}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="text-indigo-400 font-semibold text-sm">{formatScore(story)}</p>
                </div>
              </Link>
            ))
          }
        </div>

        {!loading && stories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p>No data yet for this period.</p>
          </div>
        )}
      </div>
    </main>
  )
}
