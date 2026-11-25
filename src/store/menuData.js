export const INGREDIENT_IDS = {
  telur: 'prod_telur',
  indomie: 'prod_indomie',
  leMinerale: 'prod_leminerale',
}

export const MENU_ITEMS = [
  {
    id: 'menu_telur',
    name: 'Telur',
    sellPrice: 4000,
    recipe: [{ productId: INGREDIENT_IDS.telur, qty: 1 }],
  },
  {
    id: 'menu_leminerale',
    name: 'Le Minerale Dingin',
    sellPrice: 5000,
    recipe: [{ productId: INGREDIENT_IDS.leMinerale, qty: 1 }],
  },
  {
    id: 'menu_mie_mentah',
    name: 'Mie Mentah',
    sellPrice: 5000,
    recipe: [{ productId: INGREDIENT_IDS.indomie, qty: 1 }],
  },
  {
    id: 'menu_mie_goreng',
    name: 'Mie Goreng',
    sellPrice: 8000,
    recipe: [{ productId: INGREDIENT_IDS.indomie, qty: 1 }],
  },
  {
    id: 'menu_mie_telur',
    name: 'Mie + Telur',
    sellPrice: 12000,
    recipe: [
      { productId: INGREDIENT_IDS.indomie, qty: 1 },
      { productId: INGREDIENT_IDS.telur, qty: 1 },
    ],
  },
  {
    id: 'menu_mie_goreng_double',
    name: 'Mie Goreng Double',
    sellPrice: 15000,
    recipe: [{ productId: INGREDIENT_IDS.indomie, qty: 2 }],
  },
  {
    id: 'menu_mie_goreng_double_telur',
    name: 'Mie Goreng Double + Telur',
    sellPrice: 19000,
    recipe: [
      { productId: INGREDIENT_IDS.indomie, qty: 2 },
      { productId: INGREDIENT_IDS.telur, qty: 1 },
    ],
  },
  {
    id: 'menu_paket_double_telur_air',
    name: 'Paket Double Telur + Air Minum',
    sellPrice: 23000,
    recipe: [
      { productId: INGREDIENT_IDS.indomie, qty: 2 },
      { productId: INGREDIENT_IDS.telur, qty: 1 },
      { productId: INGREDIENT_IDS.leMinerale, qty: 1 },
    ],
  },
]

export function findMenu(menuId) {
  return MENU_ITEMS.find((menu) => menu.id === menuId) ?? null
}

export function priceOf(prices, menu) {
  const override = prices?.[menu.id]
  return Number.isFinite(override) ? override : menu.sellPrice
}
