import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ShoppingBag, Trash2 } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { MENU_ITEMS } from '../store/menuData'
import { cartQtyFor, cartRequirements, menuAvailability, menuIngredients } from '../utils/stock'
import { formatRupiah } from '../utils/format'
import { Badge } from '../components/Badges'
import Sheet from '../components/Sheet'
import { Stepper, Toggle } from '../components/Controls'

function MenuCard({ menu, qty, available, products, onAdd }) {
  const out = available === 0
  const low = !out && available <= 5
  const ingredients = menuIngredients(menu, products)

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={out || qty >= available}
      className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors md:p-4 ${
        out
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      } disabled:cursor-not-allowed`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-semibold text-slate-900">{menu.name}</span>
        {qty > 0 ? (
          <span className="grid h-6 min-w-6 place-items-center rounded-md bg-slate-900 px-1.5 text-xs font-semibold tabular-nums text-white">
            {qty}
          </span>
        ) : null}
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {formatRupiah(menu.sellPrice)}
      </span>
      <p className="text-[11px] leading-snug tabular-nums text-slate-500">
        {ingredients.map((item) => `${item.qty} × ${item.name}`).join(' · ')}
      </p>
      <div>
        {out ? (
          <Badge tone="rose">Out of Stock</Badge>
        ) : low ? (
          <Badge tone="amber">{available} left · Low</Badge>
        ) : (
          <Badge tone="neutral">{available} left</Badge>
        )}
      </div>
    </button>
  )
}

export default function Cashier() {
  const { products, checkout } = useStore()
  const [cart, setCart] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isPaid, setIsPaid] = useState(true)
  const [justCompleted, setJustCompleted] = useState(null)

  const availability = useMemo(
    () =>
      new Map(
        MENU_ITEMS.map((menu) => [menu.id, menuAvailability(products, menu)]),
      ),
    [products],
  )

  const enriched = useMemo(
    () =>
      cart
        .map((line) => {
          const menu = MENU_ITEMS.find((candidate) => candidate.id === line.menuId)
          if (!menu) return null
          const qty = Math.min(line.qty, availability.get(menu.id) ?? 0)
          if (qty <= 0) return null
          return { menu, qty, lineTotal: qty * menu.sellPrice }
        })
        .filter(Boolean),
    [cart, availability],
  )

  const requirements = useMemo(
    () =>
      cartRequirements(
        enriched.map((line) => ({ menuId: line.menu.id, qty: line.qty })),
        products,
      ),
    [enriched, products],
  )

  const shortages = requirements.filter(
    (requirement) => !requirement.ingredient || requirement.ingredient.batches.reduce(
      (sum, batch) => sum + batch.remainingQty,
      0,
    ) < requirement.qty,
  )

  const totalItems = enriched.reduce((sum, line) => sum + line.qty, 0)
  const totalPrice = enriched.reduce((sum, line) => sum + line.lineTotal, 0)

  useEffect(() => {
    if (!justCompleted) return undefined
    const timer = setTimeout(() => setJustCompleted(null), 3200)
    return () => clearTimeout(timer)
  }, [justCompleted])

  const addToCart = (menu) => {
    const available = availability.get(menu.id) ?? 0
    setCart((current) => {
      const existing = current.find((line) => line.menuId === menu.id)
      if (!existing) return [...current, { menuId: menu.id, qty: 1 }]
      if (existing.qty >= available) return current
      return current.map((line) =>
        line.menuId === menu.id ? { ...line, qty: line.qty + 1 } : line,
      )
    })
  }

  const setQty = (menuId, qty) => {
    if (qty <= 0) {
      setCart((current) => current.filter((line) => line.menuId !== menuId))
      return
    }
    setCart((current) =>
      current.map((line) => (line.menuId === menuId ? { ...line, qty } : line)),
    )
  }

  const completeSale = () => {
    checkout({ items: enriched.map((line) => ({ menuId: line.menu.id, qty: line.qty })), isPaid })
    setJustCompleted({ items: totalItems, total: totalPrice })
    setCart([])
    setIsPaid(true)
    setDrawerOpen(false)
  }

  return (
    <div className="space-y-4">
      {justCompleted ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <Check size={18} />
          Sale saved — {justCompleted.items} {justCompleted.items === 1 ? 'order' : 'orders'} ·{' '}
          {formatRupiah(justCompleted.total)}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {MENU_ITEMS.map((menu) => (
          <MenuCard
            key={menu.id}
            menu={menu}
            products={products}
            qty={cartQtyFor(cart, menu.id)}
            available={availability.get(menu.id) ?? 0}
            onAdd={() => addToCart(menu)}
          />
        ))}
      </div>

      {totalItems > 0 ? (
        <div className="sticky bottom-16 z-20 -mx-4 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg bg-slate-900 px-4 text-white"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag size={18} />
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="tabular-nums">{formatRupiah(totalPrice)}</span>
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs">Review</span>
            </span>
          </button>
        </div>
      ) : null}

      {totalItems > 0 ? (
        <div className="hidden md:block">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShoppingBag size={18} />
              <span className="tabular-nums">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-base font-semibold tabular-nums text-slate-900">
                {formatRupiah(totalPrice)}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="min-h-[44px] rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Review Order
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Sheet
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Review Order"
        footer={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-lg font-semibold tabular-nums text-slate-900">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              onClick={completeSale}
              disabled={totalItems === 0 || shortages.length > 0}
              className="min-h-[44px] w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              Complete Sale
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Payment status</span>
            <Toggle
              checked={isPaid}
              onChange={setIsPaid}
              onLabel="Paid"
              offLabel="Unpaid"
              label="Payment status"
            />
          </div>

          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {enriched.map(({ menu, qty, lineTotal }) => (
              <li key={menu.id} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{menu.name}</p>
                  <p className="text-xs tabular-nums text-slate-500">
                    {formatRupiah(menu.sellPrice)} × {qty} = {formatRupiah(lineTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Stepper
                    value={qty}
                    min={1}
                    max={availability.get(menu.id) ?? 1}
                    onChange={(next) => setQty(menu.id, next)}
                    label={`Quantity for ${menu.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => setQty(menu.id, 0)}
                    aria-label={`Remove ${menu.name} from cart`}
                    className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Stock used by this order</p>
            <ul className="mt-1.5 space-y-1">
              {requirements.map(({ ingredient, qty }) => {
                const short = shortages.some((item) => item.ingredient === ingredient)
                return (
                  <li
                    key={ingredient?.id ?? 'missing'}
                    className={`flex items-center justify-between text-xs tabular-nums ${
                      short ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    <span>{ingredient?.name ?? 'Unknown ingredient'}</span>
                    <span>−{qty}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {shortages.length > 0 ? (
            <p className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Not enough stock for this order. Reduce quantities before completing the sale.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Stock is deducted immediately, even for unpaid orders. You can mark an order paid
              later in Sales.
            </p>
          )}
        </div>
      </Sheet>
    </div>
  )
}
