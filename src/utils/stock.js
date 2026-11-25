import { findMenu } from '../store/menuData'

export function stockOf(product) {
  return product.batches.reduce((sum, batch) => sum + batch.remainingQty, 0)
}

export function activeBatches(product) {
  return product.batches.filter((batch) => batch.remainingQty > 0)
}

export function isLowStock(product) {
  const stock = stockOf(product)
  return stock > 0 && stock <= product.lowStockThreshold
}

export function ingredientById(products, productId) {
  return products.find((product) => product.id === productId) ?? null
}

export function menuAvailability(products, menu) {
  return menu.recipe.reduce((limit, component) => {
    const ingredient = ingredientById(products, component.productId)
    if (!ingredient) return 0
    return Math.min(limit, Math.floor(stockOf(ingredient) / component.qty))
  }, Number.POSITIVE_INFINITY)
}

export function menuIngredients(menu, products) {
  return menu.recipe
    .map((component) => {
      const ingredient = ingredientById(products, component.productId)
      return ingredient
        ? { name: ingredient.name, qty: component.qty, ingredient }
        : null
    })
    .filter(Boolean)
}

export function cartQtyFor(cart, menuId) {
  const line = cart.find((item) => item.menuId === menuId)
  return line ? line.qty : 0
}

export function cartRequirements(cart, products) {
  const totals = new Map()
  for (const line of cart) {
    const menu = findMenu(line.menuId)
    if (!menu) continue
    for (const component of menu.recipe) {
      const needed = component.qty * line.qty
      totals.set(component.productId, (totals.get(component.productId) ?? 0) + needed)
    }
  }
  return [...totals.entries()].map(([productId, qty]) => ({
    ingredient: ingredientById(products, productId),
    qty,
  }))
}
