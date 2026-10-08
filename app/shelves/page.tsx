'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ShelfPreview {
  id: number
  title: string
  description: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  _count: { stories: number }
  stories: { story: { id: number; coverColor: string; coverImage: string | null } }[]
}

function ShelfMosaic({ stories }: { stories: ShelfPreview['stories'] }) {
  const covers = stories.slice(0, 3)
  if (covers.length === 0) {
    return <div className="w-full h-24 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 text-xs">Empty shelf</div>
  }
  return (
    <div className="flex gap-1 h-24">
      {covers.map(({ story }, i) => (
        <div
          key={story.id}
          className={`rounded flex-1 bg-gradient-to-br ${i === 0 ? 'from-indigo-500/30 to-purple-500/30' : i === 1 ? 'from-pink-500/30 to-rose-500/30' : 'from-cyan-500/30 to-blue-500/30'}`}
          style={{ backgroundColor: story.coverColor + '40' }}
        >
          {story.coverImage && (
            <img src={story.coverImage} alt="" className="w-full h-full object-cover rounded" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ShelvesPage() {
  const { isLoggedIn, status } = useAuth()
  const isLoading = status === 'loading'
  const router = useRouter()
  const [shelves, setShelves] = useState<ShelfPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [newPublic, setNewPublic] = useState(true)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoggedIn, isLoading, router])

  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/shelves')
      .then(r => r.json())
      .then(data => setShelves(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  async function createShelf(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const res = await fetch('/api/shelves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc, isPublic: newPublic }),
    })
    if (res.ok) {
      const shelf = await res.json()
      setShelves(prev => [{ ...shelf, _count: { stories: 0 }, stories: [] }, ...prev])
      setNewTitle(''); setNewDesc(''); setCreating(false)
    }
  }

  async function deleteShelf(id: number) {
    await fetch(`/api/shelves/${id}`, { method: 'DELETE' })
    setShelves(prev => prev.filter(s => s.id !== id))
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-white">My Shelves</h1>
            <p className="text-gray-500 mt-1">Curate your own story collections</p>
          </div>
          <button
            onClick={() => setCreating(o => !o)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            + New Shelf
          </button>
        </div>

        {creating && (
          <form onSubmit={createShelf} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4">Create Shelf</h2>
            <div className="space-y-3">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Shelf name *"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={newPublic} onChange={e => setNewPublic(e.target.checked)} className="accent-indigo-600" />
                Make shelf public
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition">Create</button>
              <button type="button" onClick={() => setCreating(false)} className="text-gray-500 hover:text-gray-300 text-sm transition">Cancel</button>
            </div>
          </form>
        )}

        {shelves.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-lg">No shelves yet</p>
            <p className="text-sm mt-1">Create a shelf to curate your favourite stories</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {shelves.map(shelf => (
              <div key={shelf.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition group">
                <Link href={`/shelves/${shelf.id}`}>
                  <div className="p-3">
                    <ShelfMosaic stories={shelf.stories} />
                  </div>
                  <div className="px-4 pb-3">
                    <h3 className="text-white font-medium text-sm truncate group-hover:text-indigo-400 transition">{shelf.title}</h3>
                    {shelf.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{shelf.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-600">{shelf._count.stories} {shelf._count.stories === 1 ? 'story' : 'stories'}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{shelf.isPublic ? '🌐 Public' : '🔒 Private'}</span>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => deleteShelf(shelf.id)}
                    className="text-xs text-gray-700 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
