'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'
import { Story, GENRES } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

const SORT_OPTIONS = [
  { key: 'recent',    label: 'Updated' },
  { key: 'new',       label: 'New' },
  { key: 'popular',   label: 'Popular' },
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

interface FeaturedEntry {
  featuredId:   number
  category:     string
  story: Story & { chapterCount?: number }
}

interface ContinueItem {
  storyId:          number
  storyTitle:       string
  coverColor:       string
  coverImage:       string | null
  readCount:        number
  totalChapters:    number
  nextChapterId:    number
  nextChapterTitle: string
  nextChapterOrder: number
}

export default function HomePage() {
  const { isLoggedIn, user } = useAuth()
  const searchParams = useSearchParams()
  const searchQuery  = searchParams.get('search') || ''

  const [tab,      setTab]      = useState<'discover' | 'following' | 'audiobooks'>('discover')
  const [sort,     setSort]     = useState('recent')
  const [genre,    setGenre]    = useState('All')
  const [stories,  setStories]  = useState<Story[]>([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(true)
  const [hiddenGenres, setHiddenGenres] = useState<string[]>([])
  const [featured, setFeatured] = useState<FeaturedEntry[]>([])
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sf_hidden_genres')
      if (stored) setHiddenGenres(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/featured')
      .then(r => r.json())
      .then((data: FeaturedEntry[]) => setFeatured(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/users/me/continue-reading')
      .then(r => r.json())
      .then((data: ContinueItem[]) => setContinueItems(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [isLoggedIn])

  const fetchStories = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page
    const params = new URLSearchParams({ sort, page: String(currentPage) })
    if (genre !== 'All') params.set('genre', genre)
    if (searchQuery)     params.set('search', searchQuery)

    const res = await fetch(`/api/stories?${params}`)
    if (res.ok) {
      const json = await res.json()
      const data: Story[] = Array.isArray(json) ? json : (json.stories ?? [])
      setStories(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === 12)
      if (reset) setPage(1)
    }
    setLoading(false)
  }, [sort, genre, searchQuery, page])

  useEffect(() => {
    setStories([])
    setPage(1)
    fetchStories(true)
  }, [sort, genre, searchQuery])

  async function fetchFeed() {
    setLoading(true)
    const res = await fetch('/api/social/feed')
    if (res.ok) setStories(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'following') fetchFeed()
    else if (tab === 'audiobooks') fetchStories(true)
  }, [tab])

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetchStories(false)
  }

  function toggleHideGenre(g: string) {
    setHiddenGenres(prev => {
      const next = prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
      localStorage.setItem('sf_hidden_genres', JSON.stringify(next))
      return next
    })
  }

  const visibleGenres = GENRES.filter(g => !hiddenGenres.includes(g))

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero (unauthenticated only) */}
      {!isLoggedIn && !searchQuery && (
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 py-16 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-3">
            Stories Worth{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Living
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Discover, write, and collaborate on stories with readers around the world.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition">
              Start Writing Free
            </Link>
            <a href="#stories" className="border border-gray-600 hover:border-gray-500 text-gray-300 px-6 py-2.5 rounded-lg transition">
              Browse Stories
            </a>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 py-6" id="stories">
        {/* Continue Reading */}
        {isLoggedIn && continueItems.length > 0 && !searchQuery && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Continue Reading</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {continueItems.map(item => {
                const pct = item.totalChapters > 0 ? (item.readCount / item.totalChapters) * 100 : 0
                return (
                  <Link
                    key={item.storyId}
                    href={`/stories/${item.storyId}/chapters/${item.nextChapterId}`}
                    className="shrink-0 w-64 bg-gray-900 border border-gray-800 hover:border-indigo-600/60 rounded-xl overflow-hidden transition group"
                  >
                    <div
                      className="h-20 w-full relative"
                      style={{ background: `linear-gradient(135deg, ${item.coverColor}dd, ${item.coverColor}66)` }}
                    >
                      {item.coverImage && (
                        <img src={item.coverImage} alt={item.storyTitle} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      )}
                      <div className="absolute inset-0 flex items-end p-3">
                        <span className="text-xs bg-indigo-600/80 text-white px-2 py-0.5 rounded-full">
                          Ch. {item.nextChapterOrder}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition">{item.storyTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.nextChapterTitle}</p>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.readCount} of {item.totalChapters} chapters read</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Staff Picks */}
        {featured.length > 0 && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">Staff Picks</h2>
              <span className="bg-indigo-600/30 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-600/40">Curated</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {featured.map(f => (
                <Link
                  key={f.featuredId}
                  href={`/stories/${f.story.id}`}
                  className="shrink-0 w-44 bg-gray-900 border border-gray-800 hover:border-indigo-600/60 rounded-xl overflow-hidden transition group"
                >
                  <div
                    className="h-24 w-full flex items-end p-2"
                    style={{ background: `linear-gradient(135deg, ${f.story.coverColor}dd, ${f.story.coverColor}66)` }}
                  >
                    {f.story.coverImage && (
                      <img src={f.story.coverImage} alt={f.story.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <span className="text-xs bg-black/40 text-white/80 px-1.5 py-0.5 rounded capitalize">
                      {f.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-indigo-300 transition">{f.story.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{f.story.authorName}</p>
                    {(f.story.chapterCount ?? 0) > 0 && (
                      <p className="text-xs text-gray-600 mt-1">{f.story.chapterCount} ch.</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search result banner */}
        {searchQuery && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-gray-400">Search results for</span>
            <span className="text-white font-medium">"{searchQuery}"</span>
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 ml-2">Clear</Link>
          </div>
        )}

        {/* Tabs */}
        {!searchQuery && (
          <div className="flex gap-1 border-b border-gray-800 mb-6">
            {[
              { key: 'discover',   label: '🔍 Discover' },
              { key: 'following',  label: '🏠 Following', auth: true },
              { key: 'audiobooks', label: '🎧 Audiobooks' },
            ].map(t => (
              (!t.auth || isLoggedIn) && (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                    tab === t.key
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              )
            ))}
          </div>
        )}

        {/* Discover filters */}
        {(tab === 'discover' || searchQuery) && (
          <div className="mb-6 space-y-3">
            {/* Sort pills */}
            <div className="flex flex-wrap gap-2">
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

            {/* Genre pills */}
            <div className="flex items-center gap-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1">
                <button
                  onClick={() => setGenre('All')}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition ${
                    genre === 'All'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {visibleGenres.map(g => (
                  <button
                    key={g}
                    onClick={() => setGenre(g === genre ? 'All' : g)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition ${
                      genre === g
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Genre hide dropdown */}
              <div className="relative group shrink-0">
                <button className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition text-sm" title="Hide genres">
                  ⚙️
                </button>
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 w-48 z-10 hidden group-hover:block shadow-xl">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Hide genres</p>
                  {GENRES.map(g => (
                    <label key={g} className="flex items-center gap-2 py-1 cursor-pointer hover:text-white text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={hiddenGenres.includes(g)}
                        onChange={() => toggleHideGenre(g)}
                        className="accent-indigo-500"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audiobooks info banner */}
        {tab === 'audiobooks' && (
          <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">🎧</span>
            <div>
              <p className="text-indigo-200 font-medium">Every story supports Audiobook Mode</p>
              <p className="text-indigo-300/70 text-sm">Open any chapter and tap the 🎧 button to listen with your browser's text-to-speech engine.</p>
            </div>
          </div>
        )}

        {/* Following empty state */}
        {tab === 'following' && !loading && stories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🏠</p>
            <p className="text-gray-400 mb-4">Follow authors to see their latest stories here</p>
            <button onClick={() => setTab('discover')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition text-sm">
              Discover Stories
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {stories.map(s => <StoryCard key={s.id} story={s} />)}
          {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>

        {/* Empty state */}
        {!loading && stories.length === 0 && tab === 'discover' && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📚</p>
            <p>No stories found. Try a different filter.</p>
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && tab === 'discover' && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
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
