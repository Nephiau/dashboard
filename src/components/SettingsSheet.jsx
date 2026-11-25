import { useState } from 'react'
import { Eraser } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { MENU_ITEMS, priceOf } from '../store/menuData'
import Sheet from './Sheet'
import ConfirmDialog from './ConfirmDialog'

export default function SettingsSheet({ open, onClose }) {
  const { clearData, products, transactions, prices, setPrice } = useStore()
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState(null)
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(MENU_ITEMS.map((menu) => [menu.id, String(priceOf(prices, menu))])),
  )

  const handlePriceChange = (menu, raw) => {
    setDrafts((current) => ({ ...current, [menu.id]: raw }))
    if (raw.trim() === '') return
    const amount = Math.trunc(Number(raw))
    if (Number.isFinite(amount) && amount >= 0) {
      setPrice({ menuId: menu.id, sellPrice: amount })
    }
  }

  const handleClear = () => {
    clearData()
    setConfirmClear(false)
    setMessage({ tone: 'emerald', text: 'All data cleared. Add your first stock to begin.' })
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Settings">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Current data</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
              {products.length} ingredient{products.length === 1 ? '' : 's'} ·{' '}
              {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
            </p>
          </div>

          {message ? (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              {message.text}
            </p>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Menu sell prices</p>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {MENU_ITEMS.map((menu) => (
                <li key={menu.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0 truncate text-sm text-slate-700">{menu.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Rp</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      aria-label={`Sell price for ${menu.name}`}
                      value={drafts[menu.id] ?? ''}
                      onChange={(event) => handlePriceChange(menu, event.target.value)}
                      className="min-h-[40px] w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-sm tabular-nums text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Changes affect new orders only; past sales keep their recorded prices.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={products.length === 0 && transactions.length === 0}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border border-rose-200 px-4 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser size={18} />
            Clear sample data
          </button>

          <p className="text-xs leading-relaxed text-slate-500">
            Data is saved automatically to this browser.
          </p>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        description="Ingredients, batches, and every transaction will be deleted. This cannot be undone."
        confirmLabel="Clear everything"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  )
}
