'use client'

interface Point { date: string; count: number }

interface Props {
  points: Point[]
  peak:   number
}

function shortDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ViewsLineChart({ points, peak }: Props) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        Not enough data yet
      </div>
    )
  }

  const W = 800
  const H = 220
  const mt = 16   // margin top
  const mb = 28   // margin bottom (for x-axis labels)
  const ml = 40   // margin left (for y-axis labels)
  const mr = 16   // margin right
  const chartW = W - ml - mr
  const chartH = H - mt - mb

  const safeMax = peak > 0 ? peak : 1
  const n = points.length

  function px(i: number) { return ml + (i / (n - 1)) * chartW }
  function py(count: number) { return mt + chartH - (count / safeMax) * chartH }

  // Build polyline points
  const polyPoints = points.map((p, i) => `${px(i)},${py(p.count)}`).join(' ')

  // Build fill polygon (area under curve)
  const areaPoints = [
    `${px(0)},${mt + chartH}`,
    ...points.map((p, i) => `${px(i)},${py(p.count)}`),
    `${px(n - 1)},${mt + chartH}`,
  ].join(' ')

  // Y-axis labels (0, half, max)
  const yLabels = [0, Math.round(safeMax / 2), safeMax]

  // X-axis labels — show at most 6 evenly spaced
  const xLabelCount = Math.min(6, n)
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / (xLabelCount - 1)) * (n - 1))
  )

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-48"
      aria-label="Views over time chart"
    >
      {/* Background */}
      <rect x="0" y="0" width={W} height={H} fill="#111827" rx="8" />

      {/* Horizontal grid lines */}
      {yLabels.map((v, i) => {
        const y = py(v)
        return (
          <g key={i}>
            <line x1={ml} y1={y} x2={W - mr} y2={y} stroke="#1f2937" strokeWidth="1" />
            <text x={ml - 6} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="11">
              {v}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill="rgba(99,102,241,0.15)" />

      {/* Line */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points — every nth to avoid crowding */}
      {points.map((p, i) => {
        if (n > 30 && i % Math.ceil(n / 30) !== 0 && i !== n - 1 && i !== 0) return null
        return (
          <g key={i}>
            <circle cx={px(i)} cy={py(p.count)} r="3" fill="#6366f1" />
            <title>{shortDate(p.date)}: {p.count} views</title>
          </g>
        )
      })}

      {/* X-axis labels */}
      {xLabelIndices.map(i => (
        <text
          key={i}
          x={px(i)}
          y={H - 4}
          textAnchor="middle"
          fill="#4b5563"
          fontSize="11"
        >
          {shortDate(points[i].date)}
        </text>
      ))}
    </svg>
  )
}
