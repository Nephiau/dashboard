import { INGREDIENT_IDS } from './menuData'

export function createSampleState() {
  return {
    products: [
      {
        id: INGREDIENT_IDS.telur,
        name: 'Telur',
        lowStockThreshold: 10,
        batches: [],
      },
      {
        id: INGREDIENT_IDS.indomie,
        name: 'Indomie Goreng',
        lowStockThreshold: 10,
        batches: [],
      },
      {
        id: INGREDIENT_IDS.leMinerale,
        name: 'Le Minerale Dingin',
        lowStockThreshold: 5,
        batches: [],
      },
    ],
    transactions: [],
    prices: {},
  }
}
