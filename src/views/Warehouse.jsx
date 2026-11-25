import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, PackagePlus, Pencil, Trash2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../store/StoreContext'
import { MENU_ITEMS, priceOf } from '../store/menuData'
import {
  activeBatches,
  isLowStock,
  menuAvailability,
  menuIngredients,
  stockOf,
} from '../utils/stock'
import { formatNumber, formatRupiah, formatShortDate } from '../utils/format'
import { Badge } from '../components/Badges'
import { Field, inputClass } from '../components/Controls'
import ConfirmDialog from '../components/ConfirmDialog'
import Sheet from '../components/Sheet'

const NEW_PRODUCT = '__new__'

function EditBatchSheet({ product, batch, open, onClose }) {
  const { editBatch } = useStore()
  const [remainingQty, setRemainingQty] = useState('')
  const [unitBuyPrice, setUnitBuyPrice] = useState('')

  useEffect(() => {
    if (!open || !batch) return
    setRemainingQty(String(batch.remainingQty))
    setUnitBuyPrice(String(batch.unitBuyPrice))
  }, [open, batch])

  const handleSave = () => {
    if (!batch) return
    editBatch({
      productId: product.id,
      batchId: batch.batchId,
      remainingQty: Math.max(0, Math.trunc(Number(remainingQty) || 0)),
      unitBuyPrice: Math.max(0, Math.trunc(Number(unitBuyPrice) || 0)),
    })
    onClose()
  }

  if (!batch) return null

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit stock batch"
      footer={
        <button
          type="button"
          onClick={handleSave}
          className="min-h-[44px] w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Save changes
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{product.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            Original batch: {formatNumber(batch.initialQty)} pcs · added{' '}
            {formatShortDate(batch.dateAdded)}
          </p>
        </div>

        <Field label="Remaining quantity (pcs)">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={remainingQty}
            onChange={(event) => setRemainingQty(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Unit buy price (Rp / pc)">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={unitBuyPrice}
            onChange={(event) => setUnitBuyPrice(event.target.value)}
            className={inputClass}
          />
        </Field>

        <p className="text-xs text-slate-500">
          Changing the unit buy price also updates the FIFO cost of future sales from this batch.
          Past sales keep their recorded cost.
        </p>
      </div>
    </Sheet>
  )
}

function AddStockSheet({ open, onClose }) {
  const { products, addStock } = useStore()
  const [productId, setProductId] = useState(products[0]?.id ?? NEW_PRODUCT)
  const [name, setName] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [packs, setPacks] = useState('1')
  const [pcsPerPack, setPcsPerPack] = useState('1')
  const [totalBuyPrice, setTotalBuyPrice] = useState('')

  const selectedId =
    productId === NEW_PRODUCT || products.some((product) => product.id === productId)
      ? productId
      : (products[0]?.id ?? NEW_PRODUCT)
  const isNew = selectedId === NEW_PRODUCT
  const packsInt = Math.max(1, Math.trunc(Number(packs) || 0))
  const pcsInt = Math.max(1, Math.trunc(Number(pcsPerPack) || 0))
  const totalQty = packsInt * pcsInt
  const buyPriceInt = Math.max(0, Math.trunc(Number(totalBuyPrice) || 0))
  const unitBuyPrice = totalQty > 0 ? Math.round(buyPriceInt / totalQty) : 0

  const canSave = totalQty > 0 && buyPriceInt > 0 && (isNew ? name.trim() !== '' : true)

  const reset = () => {
    setPacks('1')
    setPcsPerPack('1')
    setTotalBuyPrice('')
  }

  const handleSave = () => {
    if (!canSave) return
    addStock({
      productId: isNew ? null : selectedId,
      newProduct: isNew
        ? {
            name,
            lowStockThreshold: Number(lowStockThreshold) || 10,
          }
        : null,
      packs: packsInt,
      pcsPerPack: pcsInt,
      totalBuyPrice: buyPriceInt,
    })
    reset()
    setName('')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add Stock"
      footer={
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="min-h-[44px] w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Save Stock
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Ingredient">
          <select
            value={selectedId}
            onChange={(event) => setProductId(event.target.value)}
            className={inputClass}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
            <option value={NEW_PRODUCT}>+ Create new ingredient</option>
          </select>
        </Field>

        {isNew ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Field label="Ingredient name">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Indomie Goreng"
                className={inputClass}
              />
            </Field>
            <Field label="Low stock threshold (pcs)">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Packs / boxes bought">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={packs}
              onChange={(event) => setPacks(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Pieces per pack">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={pcsPerPack}
              onChange={(event) => setPcsPerPack(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Total buy price for this purchase (Rp)">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={totalBuyPrice}
            onChange={(event) => setTotalBuyPrice(event.target.value)}
            placeholder="48000"
            className={inputClass}
          />
        </Field>

        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {totalQty > 0 && buyPriceInt > 0 ? (
            <p>
              Adding{' '}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatNumber(totalQty)} pcs
              </span>{' '}
              @{' '}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatRupiah(unitBuyPrice)}/pc
              </span>
            </p>
          ) : (
            <p className="text-slate-500">Fill in quantity and buy price to see the unit cost.</p>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function StockChart({ products }) {
  const data = products.map((product) => ({
    name: product.name,
    shortName: product.name.length > 20 ? `${product.name.slice(0, 19)}…` : product.name,
    stock: stockOf(product),
    low: isLowStock(product),
    out: stockOf(product) === 0,
  }))

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            width={128}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
            formatter={(value) => [`${value} pcs`, 'Stock']}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 12,
              boxShadow: 'none',
            }}
          />
          <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.out ? '#fca5a5' : entry.low ? '#fbbf24' : '#0f172a'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function BatchRow({ batch, index, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded bg-slate-100 text-[11px] font-semibold tabular-nums text-slate-500">
          {index + 1}
        </span>
        <span className="tabular-nums text-slate-700">
          {formatNumber(batch.remainingQty)} / {formatNumber(batch.initialQty)} pcs
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{formatShortDate(batch.dateAdded)}</span>
        <span className="tabular-nums font-medium text-slate-900">
          @ {formatRupiah(batch.unitBuyPrice)}
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit batch"
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete batch"
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function Warehouse() {
  const { products, prices, deleteBatch, deleteProduct } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)
  const [confirmBatch, setConfirmBatch] = useState(null)
  const [confirmProduct, setConfirmProduct] = useState(null)

  const totals = useMemo(() => {
    const stock = products.reduce((sum, product) => sum + stockOf(product), 0)
    const low = products.filter(isLowStock).length
    return { stock, low }
  }, [products])

  const editingProduct = products.find((product) => product.id === editing?.productId)
  const editingBatch = editingProduct?.batches.find((batch) => batch.batchId === editing?.batchId)
  const confirmBatchProduct = products.find((product) => product.id === confirmBatch?.productId)
  const confirmBatchRecord = confirmBatchProduct?.batches.find(
    (batch) => batch.batchId === confirmBatch?.batchId,
  )
  const confirmProductRecord = products.find((product) => product.id === confirmProduct)

  const removeBatch = () => {
    if (!confirmBatch) return
    deleteBatch(confirmBatch)
    setConfirmBatch(null)
  }

  const removeProduct = () => {
    if (!confirmProduct) return
    deleteProduct(confirmProduct)
    if (expanded === confirmProduct) setExpanded(null)
    setConfirmProduct(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          <span className="tabular-nums font-semibold text-slate-900">{formatNumber(totals.stock)}</span>{' '}
          pcs in stock
          {totals.low > 0 ? (
            <span className="ml-2 tabular-nums text-amber-600">{totals.low} low</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <PackagePlus size={18} />
          Add Stock
        </button>
      </div>

      {products.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Remaining stock</h2>
          <StockChart products={products} />
          <p className="mt-2 text-xs text-slate-500">
            Amber bars are low stock, rose bars are out of stock.
          </p>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
          Ingredients &amp; batches
        </h2>
        {products.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No inventory yet. Tap “Add Stock” to record your first purchase.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {products.map((product) => {
              const stock = stockOf(product)
              const isOpen = expanded === product.id
              const batches = activeBatches(product)
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : product.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs tabular-nums text-slate-500">{formatNumber(stock)} pcs left</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {stock === 0 ? (
                        <Badge tone="rose">Out of Stock</Badge>
                      ) : isLowStock(product) ? (
                        <Badge tone="amber">Low stock</Badge>
                      ) : null}
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                      {product.batches.length === 0 ? (
                        <p className="py-2 text-xs text-slate-500">
                          No batches recorded. Tap “Add Stock” to add some.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {product.batches.map((batch, index) => (
                            <BatchRow
                              key={batch.batchId}
                              batch={batch}
                              index={index}
                              onEdit={() =>
                                setEditing({ productId: product.id, batchId: batch.batchId })
                              }
                              onDelete={() =>
                                setConfirmBatch({ productId: product.id, batchId: batch.batchId })
                              }
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <p className="text-xs text-slate-500">
                          {batches.length} active batch{batches.length === 1 ? '' : 'es'} · oldest
                          consumed first (FIFO)
                        </p>
                        <button
                          type="button"
                          onClick={() => setConfirmProduct(product.id)}
                          className="flex min-h-[36px] items-center gap-1.5 rounded-md px-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
          Cashier menu &amp; stock usage
        </h2>
        <ul className="divide-y divide-slate-200">
          {MENU_ITEMS.map((menu) => {
            const available = menuAvailability(products, menu)
            return (
              <li key={menu.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{menu.name}</p>
                  <p className="text-xs tabular-nums text-slate-500">
                    {formatRupiah(priceOf(prices, menu))} ·{' '}
                    {menuIngredients(menu, products)
                      .map((item) => `−${item.qty} ${item.name}`)
                      .join(', ')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900">{formatNumber(available)}</p>
                  <p className="text-[11px] text-slate-500">sellable</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <AddStockSheet open={addOpen} onClose={() => setAddOpen(false)} />

      <EditBatchSheet
        open={Boolean(editing)}
        product={editingProduct}
        batch={editingBatch}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmBatch)}
        title="Delete this batch?"
        description={
          confirmBatchRecord && confirmBatchProduct
            ? `${confirmBatchProduct.name} · ${formatNumber(confirmBatchRecord.remainingQty)} pcs @ ${formatRupiah(confirmBatchRecord.unitBuyPrice)}. This removes the batch and its remaining stock permanently.`
            : undefined
        }
        confirmLabel="Delete batch"
        onConfirm={removeBatch}
        onCancel={() => setConfirmBatch(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmProduct)}
        title="Delete this ingredient?"
        description={
          confirmProductRecord
            ? `${confirmProductRecord.name} and its ${confirmProductRecord.batches.length} batch(es) will be removed. Menu items that use it will no longer be sellable.`
            : undefined
        }
        confirmLabel="Delete ingredient"
        onConfirm={removeProduct}
        onCancel={() => setConfirmProduct(null)}
      />
    </div>
  )
}
