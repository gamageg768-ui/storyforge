'use client'

import { useState } from 'react'

interface Props {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  count?: number
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showLabel = false,
  count,
}: Props) {
  const [hover, setHover] = useState(0)

  const sizeMap = { sm: 14, md: 18, lg: 22 }
  const px = sizeMap[size]

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = (hover || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly || !onChange}
            onClick={() => {
              if (onChange) {
                onChange(value === star ? 0 : star)
              }
            }}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-transform ${!readonly && onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill={filled ? '#f59e0b' : 'none'}
              stroke={filled ? '#f59e0b' : '#6b7280'}
              strokeWidth="1.5"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </button>
        )
      })}
      {showLabel && value > 0 && (
        <span className="text-amber-400 text-sm font-medium ml-1">{value.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-gray-500 text-xs ml-1">({count})</span>
      )}
    </div>
  )
}
