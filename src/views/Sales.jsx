import { useMemo, useState } from 'react'
import { Ban, ReceiptText } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { formatNumber, formatRupiah, formatShortDate, formatTime, startOfDay } from '../utils/format'
import { StatusPill } from '../components/Badges'
import ConfirmDialog from '../components/ConfirmDialog'

const FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'all', label: 'All Time' },
]

function rangeFor(filter) {
  if (filter === 'all') return null
  const today = startOfDay(new Date())
  if (filter === 'today') {
    return { start: today, end: null }
  }
  if (filter === 'yesterday') {
    const start = new Date(today)
    start.setDate(start.getDate() - 1)
    return { start, end: today }
  }
  const start = new Date(today)
  start.setDate(start.getDate() - 6)
  return { start, end: null }
}

function summariseConsumption(items) {
  const totals = new Map()
  for (const item of items) {
    for (const consumed of item.consumedBatches) {
      const name = consumed.productName || 'Unknown'
      totals.set(name, (totals.get(name) ?? 0) + consumed.qty)
    }
  }
  if (totals.size === 0) return '—'
  return [...totals.entries()].map(([name, qty]) => `${name} −${qty}`).join(', ')
}

function KpiCard({ label, value, sub, tone = 'default' }) {
  const valueClass =
    tone === 'profit'
      ? 'text-emerald-600'
      : tone === 'loss'
        ? 'text-rose-600'
        : 'text-slate-900'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs tabular-nums text-slate-500">{sub}</p> : null}
    </div>
  )
}

export default function Sales() {
  const { transactions, togglePaid, voidTransaction } = useStore()
  const [filter, setFilter] = useState('today')
  const [pendingVoid, setPendingVoid] = useState(null)

  const filtered = useMemo(() => {
    const range = rangeFor(filter)
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    )
    if (!range) return sorted
    return sorted.filter((transaction) => {
      const time = new Date(transaction.timestamp)
      if (time < range.start) return false
      if (range.end && time >= range.end) return false
      return true
    })
  }, [transactions, filter])

  const completed = filtered.filter((transaction) => transaction.status === 'completed')

  const kpis = useMemo(() => {
    const itemsSold = completed.reduce(
      (sum, transaction) =>
        sum + transaction.items.reduce((lineSum, item) => lineSum + item.qtySold, 0),
      0,
    )
    const revenue = completed.reduce((sum, transaction) => sum + transaction.grandTotal, 0)
    const paid = completed
      .filter((transaction) => transaction.isPaid)
      .reduce((sum, transaction) => sum + transaction.grandTotal, 0)
    const unpaid = revenue - paid
    const profit = completed.reduce((sum, transaction) => sum + transaction.totalProfit, 0)
    return { itemsSold, revenue, paid, unpaid, profit }
  }, [completed])

  const target = transactions.find((transaction) => transaction.id === pendingVoid)

  const confirmVoid = () => {
    if (!pendingVoid) return
    voidTransaction(pendingVoid)
    setPendingVoid(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            aria-pressed={filter === option.id}
            className={`min-h-[40px] rounded-lg border px-1 text-xs font-medium sm:text-sm ${
              filter === option.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard label="Orders Sold" value={`${formatNumber(kpis.itemsSold)}`} sub="Menu orders in period" />
        <KpiCard
          label="Total Revenue"
          value={formatRupiah(kpis.revenue)}
          sub={`Paid ${formatRupiah(kpis.paid)} · Unpaid ${formatRupiah(kpis.unpaid)}`}
        />
        <KpiCard
          label="Net Profit / Loss"
          value={formatRupiah(kpis.profit)}
          sub="Revenue − exact FIFO cost"
          tone={kpis.profit < 0 ? 'loss' : kpis.profit > 0 ? 'profit' : 'default'}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
          Transactions
        </h2>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ReceiptText className="mx-auto text-slate-300" size={26} />
            <p className="mt-2 text-sm text-slate-500">No sales in this period.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {filtered.map((transaction) => {
              const voided = transaction.status === 'voided'
              return (
                <li
                  key={transaction.id}
                  className={`px-4 py-3 ${voided ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs tabular-nums text-slate-500">
                        {formatShortDate(transaction.timestamp)} · {formatTime(transaction.timestamp)}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-900">
                        {transaction.items
                          .map((item) => `${item.name} × ${item.qtySold}`)
                          .join(', ')}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                        Stock used{' '}
                        {summariseConsumption(transaction.items)}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                        Profit{' '}
                        <span
                          className={
                            transaction.totalProfit < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }
                        >
                          {formatRupiah(transaction.totalProfit)}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatRupiah(transaction.grandTotal)}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusPill
                          isPaid={transaction.isPaid}
                          disabled={voided}
                          onClick={voided ? undefined : () => togglePaid(transaction.id)}
                        />
                        {voided ? (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600">
                            Voided
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingVoid(transaction.id)}
                            aria-label="Void transaction"
                            className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingVoid)}
        title="Void this order?"
        description={
          target
            ? `${formatRupiah(target.grandTotal)} · the sold quantities will be returned to their original batches and the order removed from totals.`
            : undefined
        }
        confirmLabel="Void order"
        onConfirm={confirmVoid}
        onCancel={() => setPendingVoid(null)}
      />
    </div>
  )
}
