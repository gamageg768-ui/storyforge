'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Story } from '@/types'

interface Props {
  story: Story
  compact?: boolean
}

export default function StoryCard({ story, compact = false }: Props) {
  const router  = useRouter()
  const tagList = story.tags ? story.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3) : []

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group block bg-gray-800 border border-gray-700 rounded-xl overflow-hidden
                 hover:-translate-y-1 hover:shadow-xl hover:border-gray-600 transition-all duration-200"
    >
      {/* Cover */}
      <div className="h-32 relative overflow-hidden">
        {story.coverImage ? (
          <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${story.coverColor}cc, ${story.coverColor}44)`,
              backgroundImage: `linear-gradient(135deg, ${story.coverColor}cc, ${story.coverColor}44),
                repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
              backgroundSize: 'auto, 10px 10px',
            }}
          />
        )}
        {/* Genre badge */}
        <span className="absolute top-2 left-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
          {story.genre}
        </span>
        <div className="absolute top-2 right-2 flex gap-1">
          {story.isAdult && (
            <span className="bg-red-600/80 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">18+</span>
          )}
          {story.status === 'completed' && (
            <span className="bg-emerald-600/80 text-white text-xs px-2 py-0.5 rounded-full">Complete</span>
          )}
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-playfair font-semibold text-sm line-clamp-2 drop-shadow">{story.title}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {!compact && (
          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{story.description}</p>
        )}

        {/* Author */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: story.authorColor }}
          >
            {story.authorName[0].toUpperCase()}
          </span>
          <span className="text-gray-400 text-xs truncate">{story.authorName}</span>
        </div>

        {/* Tags */}
        {!compact && tagList.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tagList.map(tag => (
              <button
                key={tag}
                onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/tags/${encodeURIComponent(tag)}`) }}
                className="bg-gray-700 hover:bg-indigo-900/40 hover:text-indigo-300 text-gray-300 text-xs px-1.5 py-0.5 rounded transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-gray-500 text-xs">
          <span>📖 {story.chapterCount ?? 0}</span>
          <span>❤️ {story.reactionCount ?? 0}</span>
          <span>💬 {story.commentCount ?? 0}</span>
          {story.avgRating != null && story.avgRating > 0 && (
            <span>⭐ {story.avgRating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
