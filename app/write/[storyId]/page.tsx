'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { GENRES, COVER_COLORS, CONTENT_WARNINGS } from '@/types'

export default function EditStoryPage({ params }: { params: { storyId: string } }) {
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()
  const storyId = params.storyId

  const [title,           setTitle]           = useState('')
  const [description,     setDescription]     = useState('')
  const [genre,           setGenre]           = useState('General')
  const [status,          setStatus]          = useState('ongoing')
  const [coverColor,      setCoverColor]      = useState<string>(COVER_COLORS[0])
  const [coverImage,      setCoverImage]      = useState<string | null>(null)
  const [isAdult,         setIsAdult]         = useState(false)
  const [contentWarnings, setContentWarnings] = useState<string[]>([])
  const [tags,            setTags]            = useState('')
  const [chapters,        setChapters]        = useState<any[]>([])
  const [loading,         setLoading]         = useState(false)
  const [uploading,       setUploading]       = useState(false)
  const [error,           setError]           = useState('')
  const [fetching,        setFetching]        = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/stories/${storyId}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title)
        setDescription(data.description)
        setGenre(data.genre)
        setStatus(data.status)
        setCoverColor(data.coverColor)
        setCoverImage(data.coverImage || null)
        setIsAdult(data.isAdult || false)
        setContentWarnings(data.contentWarnings ? data.contentWarnings.split(',').filter(Boolean) : [])
        setTags(data.tags)
        setChapters(data.chapters || [])
        setFetching(false)
      })
  }, [storyId])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/cover', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setCoverImage(url)
    } else {
      const d = await res.json()
      setError(d.error || 'Upload failed')
    }
  }

  function toggleWarning(w: string) {
    setContentWarnings(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch(`/api/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, genre, status, tags,
        coverColor, coverImage, isAdult,
        contentWarnings: contentWarnings.join(','),
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.push(`/stories/${storyId}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this story? This cannot be undone.')) return
    await fetch(`/api/stories/${storyId}`, { method: 'DELETE' })
    router.push('/')
  }

  if (fetching) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading…</div>
    </div>
  )

  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-playfair text-3xl font-bold text-white">Edit Story</h1>
          <div className="flex gap-2">
            <Link href={`/write/${storyId}/chapter`}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-2 rounded-lg transition">
              + Add New Chapter
            </Link>
            <Link href={`/stories/${storyId}`}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition">
              View Story
            </Link>
          </div>
        </div>

        <div className="xl:grid xl:grid-cols-[1fr_340px] gap-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Cover</label>
              <div className="flex gap-4 items-start">
                <div>
                  {coverImage ? (
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden group">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setCoverImage(null)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs">Remove</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="w-20 h-28 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-400 transition text-xs gap-1">
                      <span className="text-lg">{uploading ? '⏳' : '📷'}</span>
                      <span>{uploading ? 'Uploading…' : 'Upload'}</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Colour fallback:</p>
                  <div className="flex flex-wrap gap-2">
                    {COVER_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setCoverColor(c)}
                        className={`w-7 h-7 rounded-full transition ${coverColor === c && !coverImage ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Genre</label>
                <select value={genre} onChange={e => setGenre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500">
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500">
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Tags</label>
              <input value={tags} onChange={e => setTags(e.target.value)}
                placeholder="magic, adventure, enemies-to-lovers"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isAdult} onChange={e => setIsAdult(e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                <span className="text-gray-300 text-sm font-medium">Mature / 18+ content</span>
              </label>
              <div>
                <p className="text-xs text-gray-500 mb-2">Content warnings:</p>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_WARNINGS.map(w => (
                    <button key={w} type="button" onClick={() => toggleWarning(w)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        contentWarnings.includes(w)
                          ? 'bg-amber-900/40 border-amber-700 text-amber-300'
                          : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                      }`}>{w}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition">
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleDelete}
                className="bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 font-medium py-3 px-4 rounded-lg transition">
                Delete
              </button>
            </div>
          </form>

          {/* Preview + chapters list */}
          <div className="space-y-4 mt-6 xl:mt-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-24">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
              <div className="flex gap-3 mb-3">
                <div className="w-16 h-20 rounded-lg shrink-0 flex items-end p-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${coverColor}dd, ${coverColor}88)`,
                    backgroundImage: `linear-gradient(135deg, ${coverColor}dd, ${coverColor}88), repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,
                    backgroundSize: 'auto, 8px 8px',
                  }}>
                  <p className="text-white text-xs font-playfair font-bold leading-tight line-clamp-3">{title}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-playfair font-semibold text-white text-sm mb-1 line-clamp-2">{title}</p>
                  <p className="text-gray-400 text-xs line-clamp-2">{description}</p>
                  {tagList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tagList.map(t => <span key={t} className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {chapters.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Chapters</h3>
                <div className="space-y-1.5">
                  {chapters.map(ch => (
                    <Link key={ch.id} href={`/write/${storyId}/chapter/${ch.id}`}
                      className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-750 rounded-lg transition group text-sm">
                      <span className="text-gray-500 text-xs w-5">{ch.chapterOrder}</span>
                      <span className="text-gray-300 group-hover:text-white flex-1 truncate">{ch.title}</span>
                      <span className="text-gray-600 group-hover:text-gray-400 text-xs">Edit ›</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
