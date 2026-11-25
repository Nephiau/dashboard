const tones = {
  neutral: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  emerald: 'bg-emerald-50 text-emerald-700',
}

export function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium tabular-nums ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function StatusPill({ isPaid, onClick, disabled = false }) {
  const label = isPaid ? 'Paid' : 'Unpaid'
  const classes = isPaid
    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'

  if (!onClick) {
    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold ${classes}`}>
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Mark as ${isPaid ? 'unpaid' : 'paid'}`}
      className={`inline-flex min-h-[36px] items-center rounded-md px-3 text-xs font-semibold ${classes} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  )
}
