'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  text:                string
  title:               string
  onActiveParagraph:   (idx: number | null) => void
  startFromRef:        React.MutableRefObject<((idx: number) => void) | null>
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2]
const SLEEP_OPTIONS = [
  { label: 'Off',    minutes: 0  },
  { label: '10 min', minutes: 10 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr',   minutes: 60 },
]

export default function TTSPlayer({ text, title, onActiveParagraph, startFromRef }: Props) {
  const paragraphs = text.split('\n\n').filter(Boolean)
  const total      = paragraphs.length

  const [open,          setOpen]          = useState(false)
  const [voices,        setVoices]        = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [speed,         setSpeed]         = useState(1)
  const [volume,        setVolume]        = useState(1)
  const [playing,       setPlaying]       = useState(false)
  const [paused,        setPaused]        = useState(false)
  const [paraIdx,       setParaIdx]       = useState(0)
  const [sleepChoice,   setSleepChoice]   = useState(0)          // minutes, 0 = off
  const [sleepLeft,     setSleepLeft]     = useState<number | null>(null) // seconds remaining

  const currentIdxRef = useRef(0)
  const utteranceRef  = useRef<SpeechSynthesisUtterance | null>(null)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepTickRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const speedRef      = useRef(speed)
  const volumeRef     = useRef(volume)
  const voiceRef      = useRef(selectedVoice)
  const playingRef    = useRef(playing)
  const pausedRef     = useRef(paused)

  useEffect(() => { speedRef.current  = speed        }, [speed])
  useEffect(() => { volumeRef.current = volume       }, [volume])
  useEffect(() => { voiceRef.current  = selectedVoice}, [selectedVoice])
  useEffect(() => { playingRef.current = playing     }, [playing])
  useEffect(() => { pausedRef.current  = paused      }, [paused])

  // Load voices
  useEffect(() => {
    if (typeof window === 'undefined') return
    function load() {
      const v = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
      setVoices(v)
      if (v.length > 0 && !selectedVoice) setSelectedVoice(v[0].name)
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.cancel() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    if (sleepTickRef.current)  clearInterval(sleepTickRef.current)
    setSleepLeft(null)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setPlaying(false)
    setPaused(false)
    onActiveParagraph(null)
    stopSleepTimer()
  }, [onActiveParagraph, stopSleepTimer])

  // Keyboard shortcut: Space = play/pause
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return
      if ((e.target as HTMLElement).matches('input,textarea,select,[contenteditable]')) return
      e.preventDefault()
      if (!playingRef.current) {
        // trigger play from current position via the ref
        startFromRef.current?.(currentIdxRef.current)
      } else if (pausedRef.current) {
        window.speechSynthesis.resume()
        setPaused(false)
      } else {
        window.speechSynthesis.pause()
        setPaused(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [startFromRef])

  const playFrom = useCallback((idx: number) => {
    window.speechSynthesis.cancel()
    if (idx >= total) { stop(); return }

    currentIdxRef.current = idx
    setParaIdx(idx)
    onActiveParagraph(idx)

    const utt        = new SpeechSynthesisUtterance(paragraphs[idx])
    utt.rate         = speedRef.current
    utt.volume       = volumeRef.current
    const voiceObj   = window.speechSynthesis.getVoices().find(v => v.name === voiceRef.current)
    if (voiceObj) utt.voice = voiceObj

    utt.onend = () => {
      // Chrome sometimes fires onend without actually finishing (pacing issue) — guard with small delay
      setTimeout(() => playFrom(currentIdxRef.current + 1), 50)
    }
    utt.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        setPlaying(false)
        setPaused(false)
        onActiveParagraph(null)
      }
    }

    utteranceRef.current = utt
    window.speechSynthesis.speak(utt)
    setPlaying(true)
    setPaused(false)
  }, [total, paragraphs, onActiveParagraph, stop])

  // Expose playFrom via ref so reader can call "Listen from here"
  useEffect(() => {
    startFromRef.current = playFrom
  }, [playFrom, startFromRef])

  // Auto-scroll active paragraph into view
  useEffect(() => {
    if (!playing || paused) return
    const el = document.querySelector(`[data-para-index="${paraIdx}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [paraIdx, playing, paused])

  function pause() {
    window.speechSynthesis.pause()
    setPaused(true)
  }
  function resume() {
    window.speechSynthesis.resume()
    setPaused(false)
  }
  function skipNext() { playFrom(currentIdxRef.current + 1) }
  function skipPrev() { playFrom(Math.max(0, currentIdxRef.current - 1)) }

  function handleSpeedChange(s: number) {
    setSpeed(s)
    speedRef.current = s
    // If playing, restart current paragraph at new speed
    if (playingRef.current) playFrom(currentIdxRef.current)
  }

  function handleSleepChange(minutes: number) {
    setSleepChoice(minutes)
    stopSleepTimer()
    if (minutes === 0) return
    const seconds = minutes * 60
    setSleepLeft(seconds)
    sleepTimerRef.current = setTimeout(() => stop(), seconds * 1000)
    sleepTickRef.current  = setInterval(() => {
      setSleepLeft(prev => {
        if (prev === null || prev <= 1) { clearInterval(sleepTickRef.current!); return null }
        return prev - 1
      })
    }, 1000)
  }

  function seekToPercent(pct: number) {
    const idx = Math.min(total - 1, Math.floor(pct * total))
    playFrom(idx)
  }

  function formatSleep(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const pct = total > 0 ? ((paraIdx + 1) / total) * 100 : 0

  return (
    <>
      {/* Main Player Panel */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-750 transition"
        >
          <div className="flex items-center gap-2">
            <span>🎧</span>
            <span className="text-sm font-medium text-white">Audiobook Mode</span>
            {playing && !paused && (
              <div className="flex items-end gap-0.5 h-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-indigo-400 rounded-full"
                    style={{ height: '100%', animation: 'ttsSoundwave 0.8s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
            {playing && (
              <span className="text-xs text-gray-400 ml-1">
                Para {paraIdx + 1}/{total}
              </span>
            )}
          </div>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="border-t border-gray-700 px-4 pb-4 pt-3 space-y-4">
            {/* Voice + Volume */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-36">
                <label className="text-xs text-gray-400 block mb-1">Voice</label>
                <select
                  value={selectedVoice}
                  onChange={e => { setSelectedVoice(e.target.value); voiceRef.current = e.target.value }}
                  className="w-full bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-28">
                <label className="text-xs text-gray-400 block mb-1">Volume: {Math.round(volume * 100)}%</label>
                <input
                  type="range" min="0" max="1" step="0.05" value={volume}
                  onChange={e => { const v = Number(e.target.value); setVolume(v); volumeRef.current = v }}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Speed presets */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Speed</label>
              <div className="flex gap-1.5 flex-wrap">
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      speed === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Para {paraIdx + 1} of {total}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div
                className="h-2 bg-gray-700 rounded-full cursor-pointer"
                onClick={e => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                  seekToPercent((e.clientX - rect.left) / rect.width)
                }}
              >
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={skipPrev}
                disabled={!playing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs transition"
                title="Previous paragraph"
              >
                ⏮
              </button>

              {!playing ? (
                <button
                  onClick={() => playFrom(paraIdx)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  ▶ Play
                </button>
              ) : paused ? (
                <button
                  onClick={resume}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  ▶ Resume
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  ⏸ Pause
                </button>
              )}

              <button
                onClick={skipNext}
                disabled={!playing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs transition"
                title="Next paragraph"
              >
                ⏭
              </button>

              {playing && (
                <button
                  onClick={stop}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-300 text-xs transition"
                  title="Stop"
                >
                  ⏹
                </button>
              )}
            </div>

            {/* Sleep timer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Sleep timer:</span>
                <select
                  value={sleepChoice}
                  onChange={e => handleSleepChange(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 px-2 py-1 focus:outline-none"
                >
                  {SLEEP_OPTIONS.map(o => (
                    <option key={o.minutes} value={o.minutes}>{o.label}</option>
                  ))}
                </select>
              </div>
              {sleepLeft !== null && (
                <span className="text-xs text-amber-400">⏰ Stops in {formatSleep(sleepLeft)}</span>
              )}
            </div>

            {/* Hint */}
            <p className="text-[11px] text-gray-600">Space to play/pause · Click progress bar to seek · Hover paragraphs for quick-start</p>
          </div>
        )}
      </div>

      {/* Persistent mini-bar — shown when playing but panel is closed */}
      {playing && !open && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 border-t border-gray-800 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-3">
            {/* Soundwave */}
            <div className="flex items-end gap-0.5 h-4 shrink-0">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 bg-indigo-400 rounded-full"
                  style={{ height: '100%', animation: paused ? 'none' : 'ttsSoundwave 0.8s ease-in-out infinite', animationDelay: `${i * 0.15}s`, transform: paused ? 'scaleY(0.4)' : undefined }}
                />
              ))}
            </div>

            <span className="text-xs text-gray-300 truncate flex-1">
              🎧 {title}
            </span>

            {/* Mini progress bar */}
            <div className="w-24 h-1.5 bg-gray-700 rounded-full cursor-pointer hidden sm:block"
              onClick={e => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                seekToPercent((e.clientX - rect.left) / rect.width)
              }}
            >
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>

            <span className="text-xs text-gray-500 shrink-0">{paraIdx + 1}/{total}</span>

            <div className="flex items-center gap-1 shrink-0">
              {paused ? (
                <button onClick={resume} className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition" title="Resume">▶</button>
              ) : (
                <button onClick={pause} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs transition" title="Pause">⏸</button>
              )}
              <button onClick={stop} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-red-900/50 text-gray-400 hover:text-red-300 text-xs transition" title="Stop">⏹</button>
              <button onClick={() => setOpen(true)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 text-xs transition" title="Expand">▲</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes ttsSoundwave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1);   }
        }
      `}</style>
    </>
  )
}
