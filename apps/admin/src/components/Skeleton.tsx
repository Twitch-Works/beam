import React from 'react'

export function SkeletonLine({ width = '100%', height = 14, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />
}

export function SkeletonStatCard() {
  return (
    <article className="card stat-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="60%" height={12} />
        <SkeletonLine width="40%" height={28} />
        <SkeletonLine width="50%" height={11} />
      </div>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
    </article>
  )
}

export function SkeletonTableRows({ count = 6, cols = 6 }: { count?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}><SkeletonLine height={14} width={j === 0 ? '80%' : '60%'} /></td>
          ))}
        </tr>
      ))}
    </>
  )
}
