'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function NewChapterPage({ params }: { params: { storyId: string } }) {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const storyId = params.storyId

  const [title,       setTitle]      = useState('')
  const [content,     setContent]    = useState('')
  const [summary,     setSummary]    = useState('')
  const [isPublished, setIsPublished]= useState(true)
  const [publishAt,   setPublishAt]  = useState('')
  const [saving,      setSaving]     = useState(false)
  const [saved,       setSaved]      = useState(false)
  const [error,       setError]      = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const readTime  = Math.ceil(wordCount / 200)

  function autoResize() {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
  }

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim() || saving) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/stories/${storyId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, summary, isPublished, publishAt: publishAt || null }),
    })
    setSaving(false)
    if (res.ok) {
      const ch = await res.json()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.push(`/write/${storyId}/chapter/${ch.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }
  }, [title, content, storyId, saving, isPublished, publishAt, router])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleSave])

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="sticky top-16 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <Link href={`/write/${storyId}`} className="text-gray-400 hover:text-white text-sm transition">← Story</Link>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{wordCount} words · ~{readTime} min</span>
            {saved && <span className="text-emerald-400">✓ Saved</span>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={isPublished ? 'publish' : publishAt ? 'schedule' : 'draft'}
              onChange={e => {
                const v = e.target.value
                if (v === 'publish')  { setIsPublished(true);  setPublishAt('') }
                if (v === 'draft')    { setIsPublished(false); setPublishAt('') }
                if (v === 'schedule') { setIsPublished(false) }
              }}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="publish">Publish now</option>
              <option value="draft">Save as draft</option>
              <option value="schedule">Schedule</option>
            </select>
            <button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition">
              {saving ? 'Saving…' : isPublished ? 'Publish' : publishAt ? 'Schedule' : 'Save Draft'}
            </button>
          </div>
        </div>
        {!isPublished && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Publish at:</span>
            <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500" />
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>
        )}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chapter title…"
          className="w-full bg-transparent text-4xl font-playfair font-bold text-white placeholder-gray-600 focus:outline-none mb-4" />
        <div className="flex items-center gap-3 mb-6 text-gray-600">
          <span>✦</span><div className="flex-1 h-px bg-gray-800" /><span>✦</span>
        </div>
        <textarea ref={textareaRef} value={content} onChange={e => { setContent(e.target.value); autoResize() }}
          placeholder="Begin your chapter here…"
          className="w-full bg-transparent text-gray-200 text-lg placeholder-gray-700 focus:outline-none resize-none leading-relaxed"
          style={{ fontFamily: 'Georgia, serif', lineHeight: '1.85', minHeight: '400px' }} rows={20} />
        <div className="mt-8 pt-4 border-t border-gray-800">
          <label className="block text-xs text-gray-500 mb-1">
            Chapter summary <span className="text-gray-600">(shown in table of contents · max 300 chars)</span>
          </label>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value.slice(0, 300))}
            placeholder="Brief synopsis of this chapter…"
            rows={2}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{wordCount} words</span>
            <span>{summary.length}/300</span>
          </div>
        </div>
      </div>
    </main>
  )
}
