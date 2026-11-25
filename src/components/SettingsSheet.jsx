import { useState } from 'react'
import { Eraser } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import Sheet from './Sheet'
import ConfirmDialog from './ConfirmDialog'

export default function SettingsSheet({ open, onClose }) {
  const { clearData, products, transactions } = useStore()
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState(null)

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
