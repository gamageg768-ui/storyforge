'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Comment } from '@/types'

interface Props {
  storyId?: number
  chapterId?: number
}

type SortMode = 'recent' | 'top'

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function CommentItem({ comment, onDelete, currentUserId, onReply, onLike }: {
  comment:       Comment
  onDelete:      (id: number) => void
  currentUserId?: string
  onReply:       (parentId: number, parentUsername: string) => void
  onLike:        (id: number, currentlyLiked: boolean) => void
}) {
  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.userId}`}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: comment.avatarColor }}
        >
          {comment.username[0].toUpperCase()}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href={`/profile/${comment.userId}`} className="text-sm font-medium text-white hover:text-indigo-400 transition">
            {comment.username}
          </Link>
          <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
        </div>
        {/* Annotation quote */}
        {comment.selectedText && (
          <div className="text-xs text-gray-500 italic bg-gray-800/50 px-2 py-1 rounded mb-1 border-l-2 border-indigo-500/50">
            &ldquo;{comment.selectedText.length > 120 ? comment.selectedText.slice(0, 120) + '…' : comment.selectedText}&rdquo;
          </div>
        )}
        <p className="text-gray-300 text-sm">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {/* Like button */}
          <button
            onClick={() => onLike(comment.id, comment.userLiked)}
            className={`flex items-center gap-1 text-xs transition ${
              comment.userLiked ? 'text-indigo-400' : 'text-gray-500 hover:text-indigo-400'
            }`}
          >
            ▲ {comment.likeCount > 0 ? comment.likeCount : ''}
          </button>
          <button
            onClick={() => onReply(comment.id, comment.username)}
            className="text-xs text-gray-500 hover:text-indigo-400 transition"
          >
            Reply
          </button>
          {currentUserId && String(comment.userId) === currentUserId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-gray-500 hover:text-red-400 transition"
            >
              Delete
            </button>
          )}
        </div>
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-3 border-l border-gray-700 flex flex-col gap-3">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onDelete={onDelete}
                currentUserId={currentUserId}
                onReply={onReply}
                onLike={onLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ storyId, chapterId }: Props) {
  const { user, isLoggedIn } = useAuth()
  const [comments,   setComments]   = useState<Comment[]>([])
  const [loading,    setLoading]    = useState(true)
  const [input,      setInput]      = useState('')
  const [replyTo,    setReplyTo]    = useState<{ id: number; username: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sortMode,   setSortMode]   = useState<SortMode>('recent')

  useEffect(() => { fetchComments() }, [storyId, chapterId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchComments() {
    const params = new URLSearchParams()
    if (storyId)   params.set('story_id',   String(storyId))
    if (chapterId) params.set('chapter_id', String(chapterId))
    const res = await fetch(`/api/social/comments?${params}`)
    if (res.ok) setComments(await res.json())
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/social/comment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: input.trim(), storyId, chapterId, parentId: replyTo?.id ?? null }),
    })
    if (res.ok) { setInput(''); setReplyTo(null); await fetchComments() }
    setSubmitting(false)
  }

  async function handleDelete(id: number) {
    await fetch(`/api/social/comment/${id}`, { method: 'DELETE' })
    await fetchComments()
  }

  function handleLike(id: number, currentlyLiked: boolean) {
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === id) return {
        ...c,
        userLiked: !currentlyLiked,
        likeCount: c.likeCount + (currentlyLiked ? -1 : 1),
      }
      return {
        ...c,
        replies: c.replies.map(r => r.id === id ? {
          ...r,
          userLiked: !currentlyLiked,
          likeCount: r.likeCount + (currentlyLiked ? -1 : 1),
        } : r),
      }
    }))
    fetch(`/api/social/comment/${id}/like`, { method: 'POST' }).catch(() => fetchComments())
  }

  const sorted = sortMode === 'top'
    ? [...comments].sort((a, b) => b.likeCount - a.likeCount)
    : comments

  const totalCount = comments.reduce((a, c) => a + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">💬 Comments ({totalCount})</h3>
        {comments.length > 1 && (
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setSortMode('recent')}
              className={`px-2.5 py-1 rounded transition ${sortMode === 'recent' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortMode('top')}
              className={`px-2.5 py-1 rounded transition ${sortMode === 'top' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Top
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
            style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
          >
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            {replyTo && (
              <div className="flex items-center gap-2 mb-1 text-xs text-indigo-400">
                <span>Replying to @{replyTo.username}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : 'Write a comment...'}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg transition"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-gray-500 text-sm">
          <a href="/login" className="text-indigo-400 hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading comments...</p>
      ) : sorted.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
              currentUserId={user?.id}
              onReply={(id, username) => setReplyTo({ id, username })}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}
