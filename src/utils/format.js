const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatRupiah(value) {
  const amount = Number(value)
  return rupiah.format(Number.isFinite(amount) ? amount : 0).replace(/\u00a0/g, ' ')
}

export function formatNumber(value) {
  const amount = Number(value)
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(amount) ? amount : 0)
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export function startOfDay(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}
