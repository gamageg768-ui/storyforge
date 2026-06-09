'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ReactionBar from '@/components/ReactionBar'
import CommentSection from '@/components/CommentSection'
import TTSPlayer from '@/components/TTSPlayer'
import { Chapter, Comment } from '@/types'

type Theme      = 'dark' | 'sepia' | 'paper' | 'oled'
type FontFamily = 'georgia' | 'system' | 'mono'

interface ReaderSettings {
  fontSize:   number
  font:       FontFamily
  lineHeight: number
  theme:      Theme
}

const THEMES: Record<Theme, { bg: string; text: string; toolbar: string; border: string; label: string }> = {
  dark:  { bg: '#030712', text: '#e5e7eb', toolbar: 'bg-gray-900/95',  border: 'border-gray-800', label: 'Dark'  },
  sepia: { bg: '#fdf6e3', text: '#4a3728', toolbar: 'bg-amber-50/95',  border: 'border-amber-200', label: 'Sepia' },
  paper: { bg: '#f9fafb', text: '#111827', toolbar: 'bg-gray-50/95',   border: 'border-gray-200', label: 'Paper' },
  oled:  { bg: '#000000', text: '#d1d5db', toolbar: 'bg-black/95',     border: 'border-gray-900', label: 'OLED'  },
}

const FONTS: Record<FontFamily, { css: string; label: string }> = {
  georgia: { css: 'Georgia, serif',                    label: 'Serif' },
  system:  { css: 'system-ui, sans-serif',             label: 'Sans'  },
  mono:    { css: '"Courier New", Courier, monospace', label: 'Mono'  },
}

const LINE_HEIGHTS: { value: number; label: string }[] = [
  { value: 1.5,  label: 'Compact' },
  { value: 1.85, label: 'Normal'  },
  { value: 2.2,  label: 'Relaxed' },
]

const DEFAULT_SETTINGS: ReaderSettings = { fontSize: 18, font: 'georgia', lineHeight: 1.85, theme: 'dark' }

const HIGHLIGHT_COLORS: { id: string; label: string; bg: string; border: string }[] = [
  { id: 'yellow', label: 'Yellow', bg: 'rgba(253,224,71,0.25)',  border: '#fde047' },
  { id: 'green',  label: 'Green',  bg: 'rgba(74,222,128,0.25)', border: '#4ade80' },
  { id: 'blue',   label: 'Blue',   bg: 'rgba(96,165,250,0.25)', border: '#60a5fa' },
  { id: 'pink',   label: 'Pink',   bg: 'rgba(244,114,182,0.25)',border: '#f472b6' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface PendingAnnotation {
  paragraphIndex: number
  selectedText:   string
  rect: { bottom: number; centerX: number }
}

interface PopoverMode {
  type: 'choose' | 'annotate' | 'highlight'
}

interface UserHighlight {
  id:             number
  userId:         number
  chapterId:      number
  storyId:        number
  paragraphIndex: number
  selectedText:   string
  note:           string
  color:          string
  createdAt:      string
}

export default function ChapterReaderClient({ chapter, storyId }: { chapter: Chapter; storyId: number }) {
  const { user, isLoggedIn } = useAuth()
  const [settings,     setSettings]     = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Annotation state
  const [annotations,        setAnnotations]        = useState<Comment[]>([])
  const [pendingAnnotation,  setPendingAnnotation]  = useState<PendingAnnotation | null>(null)
  const [annotationInput,    setAnnotationInput]    = useState('')
  const [submittingNote,     setSubmittingNote]     = useState(false)
  const [focusedPara,        setFocusedPara]        = useState<number | null>(null)
  const [popoverMode,        setPopoverMode]        = useState<PopoverMode>({ type: 'choose' })

  // Highlight state
  const [highlights,        setHighlights]        = useState<UserHighlight[]>([])
  const [highlightColor,    setHighlightColor]    = useState('yellow')
  const [highlightNote,     setHighlightNote]     = useState('')
  const [savingHighlight,   setSavingHighlight]   = useState(false)
  const [highlightPanelOpen, setHighlightPanelOpen] = useState(false)
  const [editingHighlight,  setEditingHighlight]  = useState<number | null>(null)
  const [editNote,          setEditNote]          = useState('')

  const settingsRef    = useRef<HTMLDivElement>(null)
  const annotationRef  = useRef<HTMLDivElement>(null)
  const highlightPanelRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completedRef   = useRef(false)
  const PROGRESS_KEY   = `sf_pos_${chapter.id}`

  // Load persisted settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sf_reader_prefs')
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
    } catch {}
  }, [])

  // Restore scroll position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY)
      if (saved) setTimeout(() => window.scrollTo({ top: Number(saved) }), 150)
    } catch {}
  }, [PROGRESS_KEY])

  // Save scroll position (debounced 300ms) + track chapter completion
  const saveScroll = useCallback(() => {
    const scrollY  = window.scrollY
    const maxScroll = document.body.scrollHeight - window.innerHeight
    if (scrollY > 100) {
      try { localStorage.setItem(PROGRESS_KEY, String(Math.round(scrollY))) } catch {}
    }
    if (!completedRef.current && isLoggedIn && maxScroll > 0 && scrollY / maxScroll >= 0.8) {
      completedRef.current = true
      fetch(`/api/stories/${chapter.storyId}/chapters/${chapter.id}/complete`, { method: 'POST' })
        .catch(() => {})
    }
  }, [PROGRESS_KEY, isLoggedIn, chapter.storyId, chapter.id])

  useEffect(() => {
    function onScroll() {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(saveScroll, 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current) }
  }, [saveScroll])

  // Save settings on change
  useEffect(() => {
    try { localStorage.setItem('sf_reader_prefs', JSON.stringify(settings)) } catch {}
  }, [settings])

  // Close settings panel on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Content protection
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'p' || k === 's' || k === 'u')) e.preventDefault()
    }
    const blockMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('keydown', blockKeys)
    document.addEventListener('contextmenu', blockMenu)
    return () => {
      document.removeEventListener('keydown', blockKeys)
      document.removeEventListener('contextmenu', blockMenu)
    }
  }, [])

  // Fetch annotations (public, paragraph-bound comments)
  useEffect(() => {
    if (!isLoggedIn) return
    fetch(`/api/social/comments?chapter_id=${chapter.id}`)
      .then(r => r.json())
      .then((data: Comment[]) => setAnnotations(data.filter(c => c.paragraphIndex != null)))
      .catch(() => {})
  }, [chapter.id, isLoggedIn])

  // Fetch private highlights
  useEffect(() => {
    if (!isLoggedIn) return
    fetch(`/api/highlights?chapterId=${chapter.id}`)
      .then(r => r.json())
      .then((data: UserHighlight[]) => setHighlights(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [chapter.id, isLoggedIn])

  // Close annotation/highlight popover on outside click
  useEffect(() => {
    if (!pendingAnnotation) return
    function onOutside(e: MouseEvent) {
      if (annotationRef.current && !annotationRef.current.contains(e.target as Node)) {
        setPendingAnnotation(null)
        setAnnotationInput('')
        setHighlightNote('')
        setPopoverMode({ type: 'choose' })
        window.getSelection()?.removeAllRanges()
      }
    }
    const id = setTimeout(() => document.addEventListener('mousedown', onOutside), 100)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', onOutside) }
  }, [pendingAnnotation])

  function updateSetting<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Handle text selection in prose area
  function handleProseMouseUp(e: React.MouseEvent) {
    if (!isLoggedIn) return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const selectedText = selection.toString().trim()
    if (selectedText.length < 3) return

    const anchor = selection.anchorNode
    const paraEl = (anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as Element)
      ?.closest('[data-para-index]')
    if (!paraEl) return
    const paragraphIndex = Number(paraEl.getAttribute('data-para-index'))

    const range = selection.getRangeAt(0)
    const rect  = range.getBoundingClientRect()
    setPendingAnnotation({
      paragraphIndex,
      selectedText: selectedText.slice(0, 300),
      rect: {
        bottom:  rect.bottom + window.scrollY,
        centerX: rect.left + rect.width / 2,
      },
    })
    setAnnotationInput('')
    setHighlightNote('')
    setHighlightColor('yellow')
    setPopoverMode({ type: 'choose' })
    setFocusedPara(null)
  }

  async function submitAnnotation() {
    if (!pendingAnnotation || !annotationInput.trim() || submittingNote) return
    setSubmittingNote(true)
    const res = await fetch('/api/social/comment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content:        annotationInput.trim(),
        chapterId:      chapter.id,
        storyId:        chapter.storyId,
        paragraphIndex: pendingAnnotation.paragraphIndex,
        selectedText:   pendingAnnotation.selectedText,
      }),
    })
    if (res.ok) {
      const newComment: Comment = await res.json()
      setAnnotations(prev => [newComment, ...prev])
      setPendingAnnotation(null)
      setAnnotationInput('')
      setPopoverMode({ type: 'choose' })
      window.getSelection()?.removeAllRanges()
    }
    setSubmittingNote(false)
  }

  async function submitHighlight() {
    if (!pendingAnnotation || savingHighlight) return
    setSavingHighlight(true)
    const res = await fetch('/api/highlights', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId:      chapter.id,
        storyId:        chapter.storyId,
        paragraphIndex: pendingAnnotation.paragraphIndex,
        selectedText:   pendingAnnotation.selectedText,
        note:           highlightNote.trim(),
        color:          highlightColor,
      }),
    })
    if (res.ok) {
      const newHighlight: UserHighlight = await res.json()
      setHighlights(prev => [...prev, newHighlight])
      setPendingAnnotation(null)
      setHighlightNote('')
      setPopoverMode({ type: 'choose' })
      window.getSelection()?.removeAllRanges()
    }
    setSavingHighlight(false)
  }

  async function deleteHighlight(id: number) {
    await fetch(`/api/highlights/${id}`, { method: 'DELETE' })
    setHighlights(prev => prev.filter(h => h.id !== id))
    if (editingHighlight === id) setEditingHighlight(null)
  }

  async function saveHighlightNote(id: number) {
    const res = await fetch(`/api/highlights/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ note: editNote }),
    })
    if (res.ok) {
      const updated: UserHighlight = await res.json()
      setHighlights(prev => prev.map(h => h.id === id ? updated : h))
      setEditingHighlight(null)
    }
  }

  // TTS integration
  const [activeTTSParagraph, setActiveTTSParagraph] = useState<number | null>(null)
  const ttsStartFromRef = useRef<((idx: number) => void) | null>(null)

  const isAuthor   = isLoggedIn && String(chapter.authorId) === user?.id
  const theme      = THEMES[settings.theme]
  const paragraphs = chapter.content.split('\n\n').filter(Boolean)

  // Group annotations and highlights by paragraph
  const annotationsByPara = annotations.reduce<Record<number, Comment[]>>((acc, a) => {
    const idx = a.paragraphIndex!
    if (!acc[idx]) acc[idx] = []
    acc[idx].push(a)
    return acc
  }, {})

  const highlightsByPara = highlights.reduce<Record<number, UserHighlight[]>>((acc, h) => {
    if (!acc[h.paragraphIndex]) acc[h.paragraphIndex] = []
    acc[h.paragraphIndex].push(h)
    return acc
  }, {})

  const highlightColorMap = HIGHLIGHT_COLORS.reduce<Record<string, typeof HIGHLIGHT_COLORS[0]>>(
    (acc, c) => { acc[c.id] = c; return acc }, {}
  )

  // Annotation popover position (clamped to viewport)
  const popoverLeft = pendingAnnotation
    ? Math.min(Math.max(8, pendingAnnotation.rect.centerX - 144), (typeof window !== 'undefined' ? window.innerWidth : 800) - 296)
    : 0

  return (
    <main className="min-h-screen transition-colors duration-200" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Sticky toolbar */}
      <div className={`sticky top-16 z-30 ${theme.toolbar} backdrop-blur border-b ${theme.border}`}>
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <Link
            href={`/stories/${storyId}`}
            className="text-sm transition hover:opacity-70"
            style={{ color: theme.text }}
          >
            ← Back to Story
          </Link>

          <span className="text-sm hidden sm:block opacity-50">
            Ch. {chapter.chapterOrder}
          </span>

          <div className="flex items-center gap-2">
            {/* Font size */}
            <button
              onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 2))}
              className="w-7 h-7 flex items-center justify-center rounded text-xs opacity-60 hover:opacity-100 transition"
              style={{ backgroundColor: 'rgba(128,128,128,0.2)' }}
            >
              A-
            </button>
            <span className="text-xs w-8 text-center opacity-50">{settings.fontSize}px</span>
            <button
              onClick={() => updateSetting('fontSize', Math.min(28, settings.fontSize + 2))}
              className="w-7 h-7 flex items-center justify-center rounded text-sm opacity-60 hover:opacity-100 transition"
              style={{ backgroundColor: 'rgba(128,128,128,0.2)' }}
            >
              A+
            </button>

            {/* Highlights panel button */}
            {isLoggedIn && (
              <div className="relative" ref={highlightPanelRef}>
                <button
                  onClick={() => setHighlightPanelOpen(o => !o)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs transition ${
                    highlightPanelOpen ? 'bg-indigo-600 text-white opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={highlightPanelOpen ? {} : { backgroundColor: 'rgba(128,128,128,0.2)' }}
                  title={`Highlights (${highlights.length})`}
                >
                  🔖
                </button>

                {/* Highlights side panel */}
                {highlightPanelOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl border border-gray-700 bg-gray-900 z-50"
                  >
                    <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">My Highlights</span>
                      <span className="text-xs text-gray-500">{highlights.length} saved</span>
                    </div>

                    {highlights.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        <p>No highlights yet.</p>
                        <p className="text-xs mt-1 opacity-60">Select text and choose Highlight.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {highlights.map(h => {
                          const hColor = highlightColorMap[h.color] ?? highlightColorMap['yellow']
                          return (
                            <div key={h.id} className="px-4 py-3">
                              <div className="flex items-start gap-2 mb-1">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                                  style={{ backgroundColor: hColor.border }}
                                />
                                <p className="text-xs text-gray-300 italic line-clamp-3 flex-1">
                                  &ldquo;{h.selectedText}&rdquo;
                                </p>
                              </div>

                              {editingHighlight === h.id ? (
                                <div className="mt-2 ml-4">
                                  <textarea
                                    value={editNote}
                                    onChange={e => setEditNote(e.target.value)}
                                    className="w-full bg-gray-800 text-gray-200 text-xs rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="Add a note…"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 mt-1.5">
                                    <button
                                      onClick={() => saveHighlightNote(h.id)}
                                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded transition"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingHighlight(null)}
                                      className="text-xs text-gray-500 hover:text-white transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="ml-4">
                                  {h.note && (
                                    <p className="text-xs text-gray-400 mt-1 mb-1">{h.note}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1">
                                    <button
                                      onClick={() => {
                                        setEditingHighlight(h.id)
                                        setEditNote(h.note)
                                        const el = document.querySelector(`[data-para-index="${h.paragraphIndex}"]`)
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                      }}
                                      className="text-xs text-gray-500 hover:text-indigo-400 transition"
                                    >
                                      {h.note ? 'Edit note' : 'Add note'}
                                    </button>
                                    <button
                                      onClick={() => deleteHighlight(h.id)}
                                      className="text-xs text-gray-500 hover:text-red-400 transition"
                                    >
                                      Delete
                                    </button>
                                    <span className="text-xs text-gray-600 ml-auto">Para {h.paragraphIndex + 1}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings panel */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className={`w-7 h-7 flex items-center justify-center rounded text-xs transition opacity-60 hover:opacity-100 ${settingsOpen ? 'opacity-100' : ''}`}
                style={{ backgroundColor: 'rgba(128,128,128,0.2)' }}
                title="Reading settings"
              >
                Aa
              </button>

              {settingsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl border p-4 z-50"
                  style={{ backgroundColor: settings.theme === 'dark' || settings.theme === 'oled' ? '#1f2937' : '#fff', borderColor: theme.border.replace('border-', '') }}
                >
                  {/* Theme */}
                  <div className="mb-4">
                    <p className="text-xs font-medium opacity-50 mb-2 uppercase tracking-wider">Theme</p>
                    <div className="flex gap-1.5">
                      {(Object.keys(THEMES) as Theme[]).map(t => (
                        <button
                          key={t}
                          onClick={() => updateSetting('theme', t)}
                          className={`flex-1 py-1.5 rounded text-xs font-medium transition border ${
                            settings.theme === t ? 'ring-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: THEMES[t].bg, color: THEMES[t].text, borderColor: '#6366f1' }}
                        >
                          {THEMES[t].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font */}
                  <div className="mb-4">
                    <p className="text-xs font-medium opacity-50 mb-2 uppercase tracking-wider">Font</p>
                    <div className="flex gap-1.5">
                      {(Object.keys(FONTS) as FontFamily[]).map(f => (
                        <button
                          key={f}
                          onClick={() => updateSetting('font', f)}
                          className={`flex-1 py-1.5 rounded text-xs transition border ${
                            settings.font === f
                              ? 'border-indigo-500 text-indigo-400'
                              : 'border-gray-600 opacity-60 hover:opacity-100'
                          }`}
                          style={{ fontFamily: FONTS[f].css }}
                        >
                          {FONTS[f].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line height */}
                  <div>
                    <p className="text-xs font-medium opacity-50 mb-2 uppercase tracking-wider">Line Spacing</p>
                    <div className="flex gap-1.5">
                      {LINE_HEIGHTS.map(lh => (
                        <button
                          key={lh.value}
                          onClick={() => updateSetting('lineHeight', lh.value)}
                          className={`flex-1 py-1.5 rounded text-xs transition border ${
                            settings.lineHeight === lh.value
                              ? 'border-indigo-500 text-indigo-400'
                              : 'border-gray-600 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {lh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isAuthor && (
              <Link
                href={`/write/${storyId}/chapter/${chapter.id}`}
                className="ml-2 text-sm opacity-60 hover:opacity-100 transition"
                style={{ color: theme.text }}
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Chapter content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm mb-2 opacity-40">Chapter {chapter.chapterOrder}</p>
          <h1 className="font-playfair text-4xl font-bold mb-4" style={{ color: theme.text }}>{chapter.title}</h1>
          <div className="flex items-center justify-center gap-2">
            <Link href={`/profile/${chapter.authorId}`}>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: chapter.avatarColor }}
              >
                {chapter.authorName[0].toUpperCase()}
              </span>
            </Link>
            <span className="text-sm opacity-60">{chapter.authorName}</span>
            <span className="opacity-30">·</span>
            <span className="text-sm opacity-40">{formatDate(chapter.createdAt)}</span>
          </div>
        </div>

        {/* TTS Player */}
        <TTSPlayer
          text={chapter.content}
          title={chapter.title}
          onActiveParagraph={setActiveTTSParagraph}
          startFromRef={ttsStartFromRef}
          paragraphCount={paragraphs.length}
        />

        {/* Prose content */}
        <div
          className="prose-reader relative"
          onCopy={e => e.preventDefault()}
          onMouseUp={handleProseMouseUp}
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          {/* Watermark overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '20px 20px',
            }}
          />

          {paragraphs.map((para, i) => {
            const paraAnnotations = annotationsByPara[i] ?? []
            const paraHighlights  = highlightsByPara[i]  ?? []
            const isExpanded      = focusedPara === i
            const isTTSActive     = i === activeTTSParagraph

            // Determine highlight border color (first highlight color wins)
            const firstHighlight = paraHighlights[0]
            const hlColor = firstHighlight ? highlightColorMap[firstHighlight.color] : null

            return (
              <div key={i} className="relative group/para mb-5">
                {/* Listen from here button */}
                {isLoggedIn && (
                  <button
                    onClick={() => ttsStartFromRef.current?.(i)}
                    className="absolute -left-7 top-1 w-5 h-5 rounded-full bg-gray-700/60 hover:bg-indigo-600/80 flex items-center justify-center opacity-0 group-hover/para:opacity-100 transition z-20 hidden md:flex"
                    title="Listen from here"
                  >
                    <span className="text-[10px] text-gray-300">▶</span>
                  </button>
                )}

                <p
                  data-para-index={i}
                  className="mb-0 rounded transition-colors duration-300"
                  style={{
                    fontFamily:      FONTS[settings.font].css,
                    lineHeight:      settings.lineHeight,
                    color:           theme.text,
                    backgroundColor: isTTSActive ? 'rgba(99,102,241,0.12)' : (hlColor ? hlColor.bg : undefined),
                    padding:         isTTSActive || hlColor ? '2px 4px' : undefined,
                    borderLeft:      hlColor ? `3px solid ${hlColor.border}` : undefined,
                    paddingLeft:     hlColor ? '8px' : undefined,
                  }}
                >
                  {para}
                </p>

                {/* Margin indicator — annotation count badge */}
                {isLoggedIn && paraAnnotations.length > 0 && (
                  <button
                    onClick={() => setFocusedPara(isExpanded ? null : i)}
                    className="absolute top-1 right-0 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center transition z-20"
                    title={`${paraAnnotations.length} note${paraAnnotations.length !== 1 ? 's' : ''}`}
                  >
                    {paraAnnotations.length}
                  </button>
                )}
                {isLoggedIn && paraAnnotations.length === 0 && (
                  <span
                    className="absolute top-1 right-0 w-5 h-5 rounded-full border border-current/20 flex items-center justify-center text-[10px] opacity-0 group-hover/para:opacity-40 transition pointer-events-none z-20"
                    style={{ color: theme.text }}
                  >
                    +
                  </span>
                )}

                {/* Expanded annotation list */}
                {isExpanded && paraAnnotations.length > 0 && (
                  <div className="mt-3 border-l-2 border-indigo-500/60 pl-3 space-y-3">
                    {paraAnnotations.map(ann => (
                      <div key={ann.id}>
                        {ann.selectedText && (
                          <p className="text-xs italic opacity-50 mb-1 line-clamp-2">
                            &ldquo;{ann.selectedText}&rdquo;
                          </p>
                        )}
                        <div className="flex items-start gap-2">
                          <div
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                            style={{ backgroundColor: ann.avatarColor }}
                          >
                            {ann.username[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-medium opacity-70">{ann.username}</span>
                            <span className="text-xs opacity-40 ml-1">{timeAgo(ann.createdAt)}</span>
                            <p className="text-sm mt-0.5" style={{ color: theme.text }}>{ann.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* End of chapter area */}
        <div className="mt-12 space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-3">How did this chapter make you feel?</p>
            <ReactionBar
              targetType="chapter"
              targetId={chapter.id}
              initialCounts={{}}
              initialUserReaction={null}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {chapter.prevChapter ? (
              <Link
                href={`/stories/${storyId}/chapters/${chapter.prevChapter.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition group"
              >
                <p className="text-gray-500 text-xs mb-1">← Previous</p>
                <p className="text-gray-300 text-sm group-hover:text-white truncate">{chapter.prevChapter.title}</p>
              </Link>
            ) : <div />}

            {chapter.nextChapter ? (
              <Link
                href={`/stories/${storyId}/chapters/${chapter.nextChapter.id}`}
                onClick={() => { try { localStorage.removeItem(PROGRESS_KEY) } catch {} }}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition group text-right"
              >
                <p className="text-gray-500 text-xs mb-1">Next →</p>
                <p className="text-gray-300 text-sm group-hover:text-white truncate">{chapter.nextChapter.title}</p>
              </Link>
            ) : (
              <Link
                href={`/stories/${storyId}`}
                onClick={() => { try { localStorage.removeItem(PROGRESS_KEY) } catch {} }}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition group text-right"
              >
                <p className="text-gray-500 text-xs mb-1">End of story</p>
                <p className="text-indigo-400 text-sm group-hover:text-indigo-300">Return to story →</p>
              </Link>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <CommentSection storyId={storyId} chapterId={chapter.id} />
          </div>
        </div>
      </div>

      {/* Selection popover — choose action, then annotate or highlight */}
      {pendingAnnotation && (
        <div
          ref={annotationRef}
          data-annotation-popover
          className="fixed z-50 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3"
          style={{ top: pendingAnnotation.rect.bottom + 10, left: popoverLeft }}
        >
          <p className="text-xs text-gray-400 italic mb-2 line-clamp-2">
            &ldquo;{pendingAnnotation.selectedText}&rdquo;
          </p>

          {/* Step 1: choose action */}
          {popoverMode.type === 'choose' && (
            <div className="flex gap-2">
              <button
                onClick={() => setPopoverMode({ type: 'annotate' })}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                ✏️ Annotate
              </button>
              <button
                onClick={() => setPopoverMode({ type: 'highlight' })}
                className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs py-2 rounded-lg border border-yellow-500/40 transition flex items-center justify-center gap-1.5"
              >
                🔆 Highlight
              </button>
            </div>
          )}

          {/* Step 2a: annotate flow */}
          {popoverMode.type === 'annotate' && (
            <>
              <textarea
                value={annotationInput}
                onChange={e => setAnnotationInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitAnnotation() }
                  if (e.key === 'Escape') { setPopoverMode({ type: 'choose' }) }
                }}
                placeholder="Add a note… (Ctrl+Enter to save)"
                className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitAnnotation}
                  disabled={!annotationInput.trim() || submittingNote}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg transition"
                >
                  {submittingNote ? 'Saving…' : 'Add Note'}
                </button>
                <button
                  onClick={() => setPopoverMode({ type: 'choose' })}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                >
                  Back
                </button>
              </div>
            </>
          )}

          {/* Step 2b: highlight flow */}
          {popoverMode.type === 'highlight' && (
            <>
              <div className="flex gap-2 mb-2">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setHighlightColor(c.id)}
                    title={c.label}
                    className="w-7 h-7 rounded-full transition border-2"
                    style={{
                      backgroundColor: c.border,
                      borderColor: highlightColor === c.id ? 'white' : 'transparent',
                      outline: highlightColor === c.id ? '2px solid #6366f1' : 'none',
                    }}
                  />
                ))}
              </div>
              <textarea
                value={highlightNote}
                onChange={e => setHighlightNote(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setPopoverMode({ type: 'choose' })
                }}
                placeholder="Optional note…"
                className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-yellow-500/60 placeholder-gray-600"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitHighlight}
                  disabled={savingHighlight}
                  className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {savingHighlight ? 'Saving…' : 'Save Highlight'}
                </button>
                <button
                  onClick={() => setPopoverMode({ type: 'choose' })}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  )
}
