import { createSampleState } from './sampleData'
import { findMenu } from './menuData'

export const STORAGE_KEY = 'kasir.pos.v4'
export const SCHEMA_VERSION = 2

function uid(prefix) {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return `${prefix}_${random}`
}

function truncateInt(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.trunc(amount) : 0
}

function cloneBatches(products) {
  return products.map((product) => ({
    ...product,
    batches: product.batches.map((batch) => ({ ...batch })),
  }))
}

function addStock(state, payload) {
  const packs = Math.max(1, truncateInt(payload.packs))
  const pcsPerPack = Math.max(1, truncateInt(payload.pcsPerPack))
  const totalAddedQty = packs * pcsPerPack
  const totalBuyPrice = Math.max(0, truncateInt(payload.totalBuyPrice))
  const unitBuyPrice = Math.round(totalBuyPrice / totalAddedQty)

  const batch = {
    batchId: uid('batch'),
    dateAdded: new Date().toISOString(),
    initialQty: totalAddedQty,
    remainingQty: totalAddedQty,
    unitBuyPrice,
  }

  if (payload.productId) {
    return {
      ...state,
      products: state.products.map((product) =>
        product.id === payload.productId
          ? { ...product, batches: [...product.batches, batch] }
          : product,
      ),
    }
  }

  if (payload.newProduct && payload.newProduct.name?.trim()) {
    const product = {
      id: uid('prod'),
      name: payload.newProduct.name.trim(),
      lowStockThreshold: Math.max(0, truncateInt(payload.newProduct.lowStockThreshold) || 10),
      batches: [batch],
    }
    return { ...state, products: [...state.products, product] }
  }

  return state
}

function editBatch(state, payload) {
  const remainingQty = Math.max(0, truncateInt(payload.remainingQty))
  const unitBuyPrice = Math.max(0, truncateInt(payload.unitBuyPrice))

  return {
    ...state,
    products: state.products.map((product) =>
      product.id !== payload.productId
        ? product
        : {
            ...product,
            batches: product.batches.map((batch) =>
              batch.batchId !== payload.batchId
                ? batch
                : {
                    ...batch,
                    remainingQty,
                    initialQty: Math.max(batch.initialQty, remainingQty),
                    unitBuyPrice,
                  },
            ),
          },
    ),
  }
}

function deleteBatch(state, payload) {
  return {
    ...state,
    products: state.products.map((product) =>
      product.id !== payload.productId
        ? product
        : {
            ...product,
            batches: product.batches.filter((batch) => batch.batchId !== payload.batchId),
          },
    ),
  }
}

function deleteProduct(state, payload) {
  return {
    ...state,
    products: state.products.filter((product) => product.id !== payload.productId),
  }
}

function checkout(state, payload) {
  const products = cloneBatches(state.products)
  const lines = []

  for (const line of payload.items) {
    const menu = findMenu(line.menuId)
    if (!menu) continue

    const requestedQty = Math.max(0, truncateInt(line.qty))
    if (requestedQty <= 0) continue

    let qtySold = requestedQty
    for (const component of menu.recipe) {
      const ingredient = products.find((candidate) => candidate.id === component.productId)
      if (!ingredient) {
        qtySold = 0
        break
      }
      const available = ingredient.batches.reduce((sum, batch) => sum + batch.remainingQty, 0)
      qtySold = Math.min(qtySold, Math.floor(available / component.qty))
    }
    if (qtySold <= 0) continue

    const consumedBatches = []

    for (const component of menu.recipe) {
      const ingredient = products.find((candidate) => candidate.id === component.productId)
      let remaining = component.qty * qtySold

      for (const batch of ingredient.batches) {
        if (remaining <= 0) break
        const qty = Math.min(batch.remainingQty, remaining)
        if (qty <= 0) continue
        batch.remainingQty -= qty
        remaining -= qty
        consumedBatches.push({
          productId: ingredient.id,
          productName: ingredient.name,
          batchId: batch.batchId,
          qty,
          unitBuyPrice: batch.unitBuyPrice,
          dateAdded: batch.dateAdded,
        })
      }

      ingredient.batches = ingredient.batches.filter((batch) => batch.remainingQty > 0)
    }

    const totalCost = consumedBatches.reduce((sum, batch) => sum + batch.qty * batch.unitBuyPrice, 0)
    const totalRevenue = qtySold * menu.sellPrice

    lines.push({
      menuId: menu.id,
      name: menu.name,
      qtySold,
      unitSellPrice: menu.sellPrice,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      consumedBatches,
    })
  }

  if (lines.length === 0) return state

  const transaction = {
    id: uid('trx'),
    timestamp: new Date().toISOString(),
    items: lines,
    grandTotal: lines.reduce((sum, line) => sum + line.totalRevenue, 0),
    totalCost: lines.reduce((sum, line) => sum + line.totalCost, 0),
    totalProfit: lines.reduce((sum, line) => sum + line.profit, 0),
    isPaid: Boolean(payload.isPaid),
    status: 'completed',
  }

  return { ...state, products, transactions: [transaction, ...state.transactions] }
}

function voidTransaction(state, transactionId) {
  const transaction = state.transactions.find((candidate) => candidate.id === transactionId)
  if (!transaction || transaction.status !== 'completed') return state

  const restorations = new Map()

  for (const item of transaction.items) {
    for (const consumed of item.consumedBatches) {
      const key = `${consumed.productId}::${consumed.batchId}`
      const existing = restorations.get(key)
      if (existing) {
        existing.qty += consumed.qty
      } else {
        restorations.set(key, { ...consumed })
      }
    }
  }

  const products = state.products.map((product) => {
    const related = [...restorations.values()].filter(
      (consumed) => consumed.productId === product.id,
    )
    if (related.length === 0) return product

    const batches = product.batches.map((batch) => ({ ...batch }))

    for (const consumed of related) {
      const existing = batches.find((batch) => batch.batchId === consumed.batchId)
      if (existing) {
        existing.remainingQty += consumed.qty
      } else {
        batches.push({
          batchId: consumed.batchId,
          dateAdded: consumed.dateAdded ?? transaction.timestamp,
          initialQty: consumed.qty,
          remainingQty: consumed.qty,
          unitBuyPrice: consumed.unitBuyPrice,
        })
      }
    }

    batches.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded))

    return { ...product, batches }
  })

  return {
    products,
    transactions: state.transactions.map((candidate) =>
      candidate.id === transactionId
        ? { ...candidate, status: 'voided', voidedAt: new Date().toISOString() }
        : candidate,
    ),
  }
}

function togglePaid(state, transactionId) {
  return {
    ...state,
    transactions: state.transactions.map((transaction) =>
      transaction.id === transactionId && transaction.status === 'completed'
        ? { ...transaction, isPaid: !transaction.isPaid }
        : transaction,
    ),
  }
}

function fail(message) {
  throw new Error(message)
}

function validateBatch(raw, productName) {
  if (!raw || typeof raw !== 'object') fail(`Invalid batch data for "${productName}".`)
  const batchId = typeof raw.batchId === 'string' ? raw.batchId : uid('batch')
  const dateAdded =
    typeof raw.dateAdded === 'string' && !Number.isNaN(Date.parse(raw.dateAdded))
      ? raw.dateAdded
      : new Date().toISOString()
  const initialQty = truncateInt(raw.initialQty)
  const remainingQty = truncateInt(raw.remainingQty)
  const unitBuyPrice = truncateInt(raw.unitBuyPrice)
  if (initialQty < 0 || remainingQty < 0 || unitBuyPrice < 0) {
    fail(`Invalid batch quantities for "${productName}".`)
  }
  return { batchId, dateAdded, initialQty, remainingQty, unitBuyPrice }
}

function validateProduct(raw) {
  if (!raw || typeof raw !== 'object') fail('Invalid ingredient entry.')
  if (typeof raw.name !== 'string' || raw.name.trim() === '') {
    fail('Every ingredient must have a name.')
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid('prod'),
    name: raw.name.trim(),
    lowStockThreshold: truncateInt(raw.lowStockThreshold) || 10,
    batches: (Array.isArray(raw.batches) ? raw.batches : [])
      .map((batch) => validateBatch(batch, raw.name))
      .sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)),
  }
}

function validateTransaction(raw) {
  if (!raw || typeof raw !== 'object') fail('Invalid transaction entry.')
  const items = (Array.isArray(raw.items) ? raw.items : []).map((item) => {
    if (!item || typeof item.name !== 'string') fail('Invalid sale line.')
    const qtySold = truncateInt(item.qtySold)
    const unitSellPrice = truncateInt(item.unitSellPrice)
    const totalRevenue = truncateInt(item.totalRevenue ?? qtySold * unitSellPrice)
    const totalCost = truncateInt(item.totalCost)
    return {
      menuId: typeof item.menuId === 'string' ? item.menuId : '',
      name: item.name,
      qtySold,
      unitSellPrice,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      consumedBatches: (Array.isArray(item.consumedBatches) ? item.consumedBatches : []).map(
        (batch) => ({
          productId: typeof batch.productId === 'string' ? batch.productId : '',
          productName: typeof batch.productName === 'string' ? batch.productName : '',
          batchId: typeof batch.batchId === 'string' ? batch.batchId : uid('batch'),
          qty: truncateInt(batch.qty),
          unitBuyPrice: truncateInt(batch.unitBuyPrice),
          dateAdded: typeof batch.dateAdded === 'string' ? batch.dateAdded : undefined,
        }),
      ),
    }
  })

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid('trx'),
    timestamp:
      typeof raw.timestamp === 'string' && !Number.isNaN(Date.parse(raw.timestamp))
        ? raw.timestamp
        : new Date().toISOString(),
    items,
    grandTotal: truncateInt(raw.grandTotal ?? items.reduce((s, i) => s + i.totalRevenue, 0)),
    totalCost: truncateInt(raw.totalCost ?? items.reduce((s, i) => s + i.totalCost, 0)),
    totalProfit: truncateInt(raw.totalProfit ?? items.reduce((s, i) => s + i.profit, 0)),
    isPaid: Boolean(raw.isPaid),
    status: raw.status === 'voided' ? 'voided' : 'completed',
    voidedAt: typeof raw.voidedAt === 'string' ? raw.voidedAt : undefined,
  }
}

export function readState(raw) {
  if (!raw || typeof raw !== 'object') fail('Saved data is not valid.')
  if (!Array.isArray(raw.products) || !Array.isArray(raw.transactions)) {
    fail('Saved data is incomplete: ingredients or transactions are missing.')
  }
  return {
    products: raw.products.map(validateProduct),
    transactions: raw.transactions.map(validateTransaction),
  }
}

export function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSampleState()
    return readState(JSON.parse(raw))
  } catch {
    return createSampleState()
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'addStock':
      return addStock(state, action.payload)
    case 'editBatch':
      return editBatch(state, action.payload)
    case 'deleteBatch':
      return deleteBatch(state, action.payload)
    case 'deleteProduct':
      return deleteProduct(state, action.payload)
    case 'checkout':
      return checkout(state, action.payload)
    case 'togglePaid':
      return togglePaid(state, action.payload.transactionId)
    case 'voidTransaction':
      return voidTransaction(state, action.payload.transactionId)
    case 'clear':
      return { products: [], transactions: [] }
    default:
      return state
  }
}
