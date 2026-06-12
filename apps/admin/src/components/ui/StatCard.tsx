import type { ComponentType } from 'react'

type StatCardProps = {
  label: string
  value: string | number
  delta: string
  up?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: ComponentType<any>
  iconBg: string
  iconColor: string
}

export function StatCard({ label, value, delta, up = true, Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <article className="card stat-card">
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        <p className={`stat-card__delta stat-card__delta--${up ? 'up' : 'down'}`}>{delta}</p>
      </div>
      <div className="stat-card__icon" style={{ background: iconBg, color: iconColor }}>
        <Icon size={24} strokeWidth={2} />
      </div>
    </article>
  )
}
