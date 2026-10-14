/**
 * CategoryChart.tsx — F6
 * Pure SVG bar chart for category breakdown.
 * No external charting library — vanilla SVG only.
 */

import type { CategoryTotal } from '../api'

interface Props {
  data: CategoryTotal[]
}

const W = 560
const H = 240
const PAD = { top: 20, right: 20, bottom: 60, left: 70 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

const COLOURS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
]

export default function CategoryChart({ data }: Props) {
  if (data.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: 14 }}>No data yet.</p>
  }

  // absolute values for bar heights (chart shows magnitude per category)
  const values = data.map((d) => Math.abs(Number(d.total)))
  const max = Math.max(...values, 1)

  const barW = Math.min(48, CHART_W / data.length - 8)
  const step = CHART_W / data.length

  // y-axis ticks (5 evenly spaced)
  const ticks = Array.from({ length: 6 }, (_, i) => (max / 5) * i)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, display: 'block' }}
      aria-label="Category breakdown chart"
      role="img"
    >
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* Y-axis ticks and gridlines */}
        {ticks.map((tick) => {
          const y = CHART_H - (tick / max) * CHART_H
          return (
            <g key={tick}>
              <line x1={0} y1={y} x2={CHART_W} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text
                x={-8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#6b7280"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (values[i]! / max) * CHART_H
          const x = i * step + (step - barW) / 2
          const y = CHART_H - barH
          const colour = COLOURS[i % COLOURS.length]!
          const isNegative = Number(d.total) < 0

          return (
            <g key={d.category}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={isNegative ? '#ef4444' : colour}
                rx={3}
              >
                <title>{`${d.category}: ${d.total}`}</title>
              </rect>
              {/* value label on top */}
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#374151"
              >
                {Math.abs(Number(d.total)).toFixed(0)}
              </text>
              {/* category label below axis */}
              <text
                x={x + barW / 2}
                y={CHART_H + 16}
                textAnchor="middle"
                fontSize={11}
                fill="#374151"
                transform={`rotate(-30, ${x + barW / 2}, ${CHART_H + 16})`}
              >
                {d.category.length > 10 ? d.category.slice(0, 9) + '…' : d.category}
              </text>
            </g>
          )
        })}

        {/* Axes */}
        <line x1={0} y1={0} x2={0} y2={CHART_H} stroke="#d1d5db" strokeWidth={1} />
        <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke="#d1d5db" strokeWidth={1} />
      </g>
    </svg>
  )
}
