'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Notification } from '@/types'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [open,          setOpen]          = useState(false)
  const [loading,       setLoading]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications?limit=15')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/notifications/read-all', { method: 'PUT' })
    setLoading(false)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  async function markOneRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  function notifLink(n: Notification) {
    if (n.chapterId && n.storyId) return `/stories/${n.storyId}/chapters/${n.chapterId}`
    if (n.storyId) return `/stories/${n.storyId}`
    if (n.actorId)  return `/profile/${n.actorId}`
    return '#'
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  function typeIcon(type: string) {
    if (type === 'new_follower') return '👤'
    if (type === 'new_comment')  return '💬'
    if (type === 'new_chapter')  return '📖'
    return '🔔'
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center leading-none font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-medium text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} disabled={loading}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  href={notifLink(n)}
                  onClick={() => { if (!n.isRead) markOneRead(n.id); setOpen(false) }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-700/60 transition border-b border-gray-700/50 last:border-0 ${
                    !n.isRead ? 'bg-indigo-900/20' : ''
                  }`}
                >
                  <span className="text-base mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-snug line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5 shrink-0" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
