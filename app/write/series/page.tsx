'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Series {
  id:          number
  title:       string
  description: string
  stories:     { order: number; story: { id: number; title: string; coverColor: string } }[]
}

interface MyStory {
  id:    number
  title: string
  coverColor: string
}

export default function ManageSeriesPage() {
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()

  const [series,     setSeries]     = useState<Series[]>([])
  const [myStories,  setMyStories]  = useState<MyStory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [creating,   setCreating]   = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [newDesc,    setNewDesc]    = useState('')
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return
    Promise.all([
      fetch(`/api/series?authorId=${user.id}`).then(r => r.json()),
      fetch(`/api/stories?page=1`).then(r => r.json()).then(d => (d.stories || d).filter((s: any) => s.authorId === Number(user.id))),
    ]).then(([s, st]) => { setSeries(s); setMyStories(st); setLoading(false) })
  }, [isLoggedIn, user?.id])

  if (!isLoggedIn) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Sign in to manage series.</p>
    </main>
  )

  async function createSeries(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!newTitle.trim()) { setError('Title required'); return }
    setCreating(true)
    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc }),
    })
    if (res.ok) {
      const created = await res.json()
      setSeries(prev => [{ ...created, stories: [] }, ...prev])
      setNewTitle('')
      setNewDesc('')
    } else {
      const d = await res.json()
      setError(d.error || 'Failed')
    }
    setCreating(false)
  }

  async function deleteSeries(id: number) {
    if (!confirm('Delete this series?')) return
    await fetch(`/api/series/${id}`, { method: 'DELETE' })
    setSeries(prev => prev.filter(s => s.id !== id))
  }

  async function addStoryToSeries(seriesId: number, storyId: number) {
    await fetch(`/api/series/${seriesId}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId }),
    })
    const updated = await fetch(`/api/series/${seriesId}`).then(r => r.json())
    setSeries(prev => prev.map(s => s.id === seriesId ? { ...s, stories: updated.stories } : s))
  }

  async function removeStoryFromSeries(seriesId: number, storyId: number) {
    await fetch(`/api/series/${seriesId}/stories`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId }),
    })
    setSeries(prev => prev.map(s =>
      s.id === seriesId ? { ...s, stories: s.stories.filter(ss => ss.story.id !== storyId) } : s
    ))
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-playfair text-2xl font-bold text-white">Manage Series</h1>
          <Link href="/series" className="text-indigo-400 text-sm hover:underline">View all series →</Link>
        </div>

        {/* Create new series */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Create New Series</h2>
          <form onSubmit={createSeries} className="space-y-3">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Series title…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {creating ? 'Creating…' : '+ Create Series'}
            </button>
          </form>
        </div>

        {/* Existing series */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : series.length === 0 ? (
          <p className="text-gray-500 text-sm">No series yet. Create one above.</p>
        ) : (
          <div className="space-y-4">
            {series.map(s => {
              const storyIdsInSeries = new Set(s.stories.map(ss => ss.story.id))
              const availableToAdd = myStories.filter(ms => !storyIdsInSeries.has(ms.id))
              return (
                <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{s.title}</h3>
                    <button onClick={() => deleteSeries(s.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {s.stories.map(ss => (
                      <div key={ss.story.id} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ss.story.coverColor }} />
                        <span className="text-gray-300 flex-1 truncate">{ss.story.title}</span>
                        <button
                          onClick={() => removeStoryFromSeries(s.id, ss.story.id)}
                          className="text-gray-600 hover:text-red-400 text-xs"
                        >✕</button>
                      </div>
                    ))}
                    {s.stories.length === 0 && <p className="text-gray-600 text-xs">No stories added yet.</p>}
                  </div>

                  {availableToAdd.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={e => { if (e.target.value) addStoryToSeries(s.id, Number(e.target.value)) }}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-1.5 text-gray-300 focus:outline-none"
                    >
                      <option value="" disabled>+ Add a story…</option>
                      {availableToAdd.map(ms => (
                        <option key={ms.id} value={ms.id}>{ms.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
