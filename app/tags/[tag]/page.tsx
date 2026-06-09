'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'
import { Story } from '@/types'

const SORT_OPTIONS = [
  { key: 'popular',   label: 'Popular'   },
  { key: 'recent',    label: 'Recent'    },
  { key: 'top_rated', label: 'Top Rated' },
]

function SkeletonCard() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  )
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)

  const [sort,    setSort]    = useState('popular')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchStories = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page
    const params = new URLSearchParams({ tag, sort, page: String(currentPage) })
    const res = await fetch(`/api/stories?${params}`)
    if (res.ok) {
      const json = await res.json()
      const data: Story[] = Array.isArray(json) ? json : (json.stories ?? [])
      setStories(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === 12)
      if (reset) setPage(1)
    }
    setLoading(false)
  }, [tag, sort, page])

  useEffect(() => {
    setStories([])
    setPage(1)
    fetchStories(true)
  }, [sort, tag])

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition">
            Home
          </Link>
          <span className="text-gray-700 mx-2">/</span>
          <span className="text-gray-400 text-sm">Tags</span>
          <h1 className="font-playfair text-3xl font-bold text-white mt-2">
            Stories tagged:{' '}
            <span className="text-indigo-400">{tag}</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {SORT_OPTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                sort === s.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {stories.map(s => <StoryCard key={s.id} story={s} />)}
          {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>

        {!loading && stories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">🏷</p>
            <p className="text-lg">No stories found with this tag.</p>
            <Link href="/" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm transition">
              Browse all stories
            </Link>
          </div>
        )}

        {!loading && hasMore && stories.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => { const next = page + 1; setPage(next); fetchStories(false) }}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-6 py-2.5 rounded-lg transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
