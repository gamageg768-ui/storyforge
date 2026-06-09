'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GENRES, Story } from '@/types'

function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/stories/${story.id}`} className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition group">
      <div className="h-2" style={{ backgroundColor: story.coverColor }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-white font-semibold text-sm group-hover:text-indigo-300 transition line-clamp-2 leading-snug">{story.title}</h3>
          {story.isAdult && <span className="shrink-0 text-[10px] bg-red-900/40 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded">18+</span>}
        </div>
        <p className="text-gray-400 text-xs mb-2">by {story.authorName}</p>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{story.description}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
          <span className="bg-gray-800 px-2 py-0.5 rounded">{story.genre}</span>
          <span className={`px-2 py-0.5 rounded ${
            story.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
            story.status === 'hiatus'    ? 'bg-amber-900/30 text-amber-400'    :
                                           'bg-gray-800 text-gray-400'
          }`}>{story.status}</span>
          <span>{story.chapterCount ?? 0} ch.</span>
          {story.avgRating != null && <span>⭐ {story.avgRating.toFixed(1)}</span>}
        </div>
      </div>
    </Link>
  )
}

const STATUS_OPTIONS = [
  { value: '',          label: 'Any Status'  },
  { value: 'ongoing',   label: 'Ongoing'     },
  { value: 'completed', label: 'Completed'   },
  { value: 'hiatus',    label: 'Hiatus'      },
]

export default function SearchPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Filter state — initialised from URL
  const [query,      setQuery]      = useState(searchParams.get('q') || '')
  const [genres,     setGenres]     = useState<string[]>(searchParams.getAll('genre'))
  const [status,     setStatus]     = useState(searchParams.get('status') || '')
  const [minRating,  setMinRating]  = useState(searchParams.get('minRating') || '')
  const [maxRating,  setMaxRating]  = useState(searchParams.get('maxRating') || '')
  const [minChapters,setMinChapters]= useState(searchParams.get('minChapters') || '')
  const [maxChapters,setMaxChapters]= useState(searchParams.get('maxChapters') || '')
  const [sort,       setSort]       = useState(searchParams.get('sort') || 'recent')

  const [stories,  setStories]  = useState<Story[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (params: URLSearchParams) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stories?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const buildAndFetch = useCallback(() => {
    const p = new URLSearchParams()
    if (query)        p.set('search', query)
    if (status)       p.set('status', status)
    if (sort)         p.set('sort', sort)
    if (minRating)    p.set('minRating', minRating)
    if (maxRating)    p.set('maxRating', maxRating)
    if (minChapters)  p.set('minChapters', minChapters)
    if (maxChapters)  p.set('maxChapters', maxChapters)
    genres.forEach(g => p.append('genre', g))
    p.set('page', '1')

    // Update URL (for deep-linking)
    const urlParams = new URLSearchParams(p)
    if (query) urlParams.set('q', query)
    router.replace(`/search?${urlParams}`, { scroll: false })

    fetchResults(p)
  }, [query, status, sort, minRating, maxRating, minChapters, maxChapters, genres, router, fetchResults])

  // Debounced re-fetch on any filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(buildAndFetch, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [buildAndFetch])

  function toggleGenre(g: string) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function clearAll() {
    setQuery(''); setGenres([]); setStatus(''); setMinRating(''); setMaxRating('')
    setMinChapters(''); setMaxChapters(''); setSort('recent')
  }

  const hasFilters = query || genres.length > 0 || status || minRating || maxRating || minChapters || maxChapters

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white font-playfair">Search Stories</h1>
          <p className="text-gray-500 text-sm mt-1">{total > 0 ? `${total} results` : loading ? 'Searching…' : 'No results'}</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 space-y-5 hidden md:block">
            {/* Text search */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block uppercase tracking-wider">Search</label>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Title, description, tags…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block uppercase tracking-wider">Sort By</label>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none"
              >
                <option value="recent">Recently Updated</option>
                <option value="new">Newest</option>
                <option value="popular">Most Reacted</option>
                <option value="top_rated">Top Rated</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block uppercase tracking-wider">Status</label>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.map(o => (
                  <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value={o.value}
                      checked={status === o.value}
                      onChange={() => setStatus(o.value)}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block uppercase tracking-wider">Genre</label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {GENRES.map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={genres.includes(g)}
                      onChange={() => toggleGenre(g)}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating range */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block uppercase tracking-wider">Star Rating</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="5" step="0.5" placeholder="Min"
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-gray-600 text-sm">–</span>
                <input
                  type="number" min="0" max="5" step="0.5" placeholder="Max"
                  value={maxRating}
                  onChange={e => setMaxRating(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Chapter count */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block uppercase tracking-wider">Chapter Count</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={minChapters}
                  onChange={e => setMinChapters(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-gray-600 text-sm">–</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={maxChapters}
                  onChange={e => setMaxChapters(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearAll}
                className="w-full text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg py-2 transition"
              >
                Clear all filters
              </button>
            )}
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Mobile search bar */}
            <div className="mb-4 md:hidden">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search stories…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-48 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-2">No stories found</p>
                <p className="text-gray-600 text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stories.map(s => <StoryCard key={s.id} story={s} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
