import { Minus, Plus } from 'lucide-react'

export function Stepper({ value, min = 1, max, onChange, label }) {
  const clamp = (next) => Math.min(max, Math.max(min, next))

  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

export function Toggle({ checked, onChange, onLabel = 'On', offLabel = 'Off', label }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200" role="group" aria-label={label}>
      <button
        type="button"
        aria-pressed={!checked}
        onClick={() => checked && onChange(false)}
        className={`min-h-[44px] px-4 text-sm font-medium ${
          !checked ? 'bg-amber-50 text-amber-700' : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
      >
        {offLabel}
      </button>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => !checked && onChange(true)}
        className={`min-h-[44px] px-4 text-sm font-medium ${
          checked ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
      >
        {onLabel}
      </button>
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export const inputClass =
  'min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm tabular-nums text-slate-900 outline-none focus:border-slate-400'
