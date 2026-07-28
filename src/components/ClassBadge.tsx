import { META } from '../lib/classificationMeta'
import type { Classification } from '../lib/types'

export function ClassBadge({ type, size = 18 }: { type: Classification; size?: number }) {
  const m = META[type]
  return (
    <span
      className="class-badge"
      title={m.label}
      style={{
        background: m.color,
        width: size,
        height: size,
        fontSize: size * 0.52,
        lineHeight: `${size}px`,
      }}
    >
      {m.glyph}
    </span>
  )
}
