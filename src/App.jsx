import { lazy, Suspense, useState } from 'react'
import { LayoutGrid, Package, ReceiptText, Settings } from 'lucide-react'

import Cashier from './views/Cashier'
import Warehouse from './views/Warehouse'
import Sales from './views/Sales'

const SettingsSheet = lazy(() => import('./components/SettingsSheet'))

const TABS = [
  { id: 'cashier', label: 'Cashier', icon: LayoutGrid, view: Cashier },
  { id: 'warehouse', label: 'Warehouse', icon: Package, view: Warehouse },
  { id: 'sales', label: 'Sales', icon: ReceiptText, view: Sales },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('cashier')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]
  const ActiveView = active.view

  return (
    <div className="min-h-dvh bg-slate-50 md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <span className="text-base font-semibold text-slate-900">Kasir</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh w-full flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:h-16 md:px-6">
          <h1 className="text-base font-semibold text-slate-900">{active.label}</h1>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="grid h-11 w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          >
            <Settings size={20} />
          </button>
        </header>

        <main className="flex-1 px-4 pt-4 pb-20 md:mx-auto md:w-full md:max-w-5xl md:px-6 md:py-6">
          <ActiveView />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-3 border-t border-slate-200 bg-white md:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 text-xs font-medium ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <Suspense fallback={null}>
        {settingsOpen ? (
          <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        ) : null}
      </Suspense>
    </div>
  )
}
