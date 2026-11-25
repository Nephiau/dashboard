# Kasir — Mobile-First POS & Batch Inventory

Beginner-friendly POS and batch inventory web app for items bought in bulk packs and sold per piece.

## Run

```bash
npm install
npm run dev
```

## Stack

- React + Vite (JavaScript only, no TypeScript)
- Tailwind CSS (mobile-first, bottom-nav on phone / sidebar on desktop)
- `lucide-react` icons, `recharts` stock chart
- Single React Context + `useReducer` store, auto-persisted to `localStorage`
- Rupiah formatting via `Intl.NumberFormat('id-ID')`, integer-only math

## How it works

- Every restock appends a **cost batch** with its own `unitBuyPrice`. Total stock is always the sum of the batches' `remainingQty`.
- Checkout consumes batches **oldest-first (FIFO)**, storing exactly which batches each sale drained so profit is exact.
- Voiding a sale restores the consumed quantities back into those same batches.
- Sales tab filters by Today / Yesterday / Last 7 Days / All Time and shows items sold, revenue (paid vs unpaid), and net profit.
- Settings drawer: a "Clear sample data" button.

The app launches with the warung menu (Telur, Le Minerale Dingin, Mie Mentah, Mie Goreng, Mie + Telur, Mie Goreng Double, Mie Goreng Double + Telur, Paket Double Telur + Air Minum) and every ingredient starts at 0 stock, so add stock first.
