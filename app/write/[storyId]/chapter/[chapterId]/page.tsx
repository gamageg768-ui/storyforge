'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Draft {
  id:      number
  title:   string
  content: string
  savedAt: string
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

export default function EditChapterPage({ params }: { params: { storyId: string; chapterId: string } }) {
  const { isLoggedIn } = useAuth()
  const { storyId, chapterId } = params

  const [title,         setTitle]        = useState('')
  const [content,       setContent]      = useState('')
  const [summary,       setSummary]      = useState('')
  const [isPublished,   setIsPublished]  = useState(true)
  const [publishAt,     setPublishAt]    = useState('')
  const [saving,        setSaving]       = useState(false)
  const [saved,         setSaved]        = useState(false)
  const [error,         setError]        = useState('')
  const [fetching,      setFetching]     = useState(true)
  const [lastAutoSaved, setLastAutoSaved]= useState<Date | null>(null)
  const [historyOpen,   setHistoryOpen]  = useState(false)
  const [drafts,        setDrafts]       = useState<Draft[]>([])
  const [draftsLoading, setDraftsLoading]= useState(false)
  const [deletingId,    setDeletingId]   = useState<number | null>(null)
  const [tick,          setTick]         = useState(0)

  const textareaRef      = useRef<HTMLTextAreaElement>(null)
  const lastSavedContent = useRef('')
  const lastSavedTitle   = useRef('')
  // Always-current refs for use in event handlers
  const contentRef       = useRef(content)
  const titleRef         = useRef(title)
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const historyOpenRef   = useRef(historyOpen)

  const wc       = wordCount(content)
  const readTime = Math.ceil(wc / 200)

  // Keep refs in sync with state
  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { titleRef.current   = title   }, [title])
  useEffect(() => { historyOpenRef.current = historyOpen }, [historyOpen])

  function autoResize() {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
  }

  useEffect(() => {
    fetch(`/api/stories/${storyId}/chapters/${chapterId}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || '')
        setContent(data.content || '')
        setSummary(data.summary || '')
        setIsPublished(data.isPublished ?? true)
        setPublishAt(data.publishAt ? new Date(data.publishAt).toISOString().slice(0, 16) : '')
        lastSavedContent.current = data.content || ''
        lastSavedTitle.current   = data.title    || ''
        setFetching(false)
        setTimeout(autoResize, 50)
      })
  }, [storyId, chapterId])

  // Warn on unsaved changes before leaving
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (
        contentRef.current !== lastSavedContent.current ||
        titleRef.current   !== lastSavedTitle.current
      ) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Tick to refresh "X ago" display
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const autoSave = useCallback(async () => {
    const c = contentRef.current
    const t = titleRef.current
    if (!c.trim() || !t.trim()) return
    if (c === lastSavedContent.current && t === lastSavedTitle.current) return
    await fetch(`/api/stories/${storyId}/chapters/${chapterId}/drafts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: t, content: c }),
    })
    lastSavedContent.current = c
    lastSavedTitle.current   = t
    setLastAutoSaved(new Date())
    // Refresh list if panel is open
    if (historyOpenRef.current) {
      const res = await fetch(`/api/stories/${storyId}/chapters/${chapterId}/drafts`)
      if (res.ok) setDrafts(await res.json())
    }
  }, [storyId, chapterId])

  // 30-second polling autosave
  useEffect(() => {
    const id = setInterval(autoSave, 30_000)
    return () => clearInterval(id)
  }, [autoSave])

  // 5-second debounced autosave on content/title change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(autoSave, 5_000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [content, title, autoSave])

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim() || saving) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, content, summary, isPublished, publishAt: publishAt || null }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }
  }, [title, content, storyId, chapterId, saving, isPublished, publishAt])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleSave])

  async function openHistory() {
    setHistoryOpen(true)
    setDraftsLoading(true)
    const res = await fetch(`/api/stories/${storyId}/chapters/${chapterId}/drafts`)
    if (res.ok) setDrafts(await res.json())
    setDraftsLoading(false)
  }

  function restoreDraft(draft: Draft) {
    if (!confirm(`Restore draft from ${relTime(draft.savedAt)}? Current content will be replaced.`)) return
    setTitle(draft.title)
    setContent(draft.content)
    setHistoryOpen(false)
    setTimeout(autoResize, 50)
  }

  async function deleteDraft(draft: Draft) {
    if (!confirm('Delete this autosave? This cannot be undone.')) return
    setDeletingId(draft.id)
    await fetch(`/api/stories/${storyId}/chapters/${chapterId}/drafts/${draft.id}`, { method: 'DELETE' })
    setDrafts(prev => prev.filter(d => d.id !== draft.id))
    setDeletingId(null)
  }

  if (fetching) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading…</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="sticky top-16 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <Link href={`/write/${storyId}`} className="text-gray-400 hover:text-white text-sm transition">← Story</Link>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{wc} words · ~{readTime} min</span>
            {lastAutoSaved && (
              <span className="text-gray-600" suppressHydrationWarning>
                Autosaved {relTime(lastAutoSaved.toISOString())}
              </span>
            )}
            {saved && <span className="text-emerald-400">Saved</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openHistory}
              className="text-gray-400 hover:text-white text-xs px-2 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
              title="Version history"
            >
              History {drafts.length > 0 && !historyOpen && (
                <span className="ml-1 bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                  {drafts.length}
                </span>
              )}
            </button>
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
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
              <option value="schedule">Scheduled</option>
            </select>
            <button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition">
              {saving ? 'Saving…' : 'Save'}
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

      {/* History panel */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHistoryOpen(false)} />
          <div className="relative w-80 bg-gray-900 border-l border-gray-800 h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900">
              <div>
                <h3 className="text-sm font-medium text-white">Version History</h3>
                {drafts.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{drafts.length} autosave{drafts.length !== 1 ? 's' : ''}</p>
                )}
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-white transition text-lg leading-none">×</button>
            </div>
            <div className="flex-1 p-4">
              {draftsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : drafts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No autosaves yet. Edits are saved every 30 seconds.</p>
              ) : (
                <div className="space-y-2">
                  {drafts.map(draft => (
                    <div key={draft.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <p className="text-gray-300 text-xs font-medium truncate">{draft.title}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{relTime(draft.savedAt)} · {wordCount(draft.content)} words</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => restoreDraft(draft)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => deleteDraft(draft)}
                            disabled={deletingId === draft.id}
                            className="text-xs text-gray-600 hover:text-red-400 transition disabled:opacity-50"
                          >
                            {deletingId === draft.id ? '…' : '×'}
                          </button>
                        </div>
                      </div>
                      {/* Content preview */}
                      <p className="text-gray-600 text-[11px] leading-snug line-clamp-2">
                        {draft.content.trim().slice(0, 120)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            <span>{wc} words</span>
            <span>{summary.length}/300</span>
          </div>
        </div>
      </div>
    </main>
  )
}
