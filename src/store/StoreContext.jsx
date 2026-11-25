import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadInitialState, reducer, SCHEMA_VERSION, STORAGE_KEY } from './store'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          savedAt: new Date().toISOString(),
          products: state.products,
          transactions: state.transactions,
          prices: state.prices,
        }),
      )
    } catch {
      // Storage can be unavailable (private browsing / quota); the app keeps working in memory.
    }
  }, [state])

  const value = useMemo(
    () => ({
      products: state.products,
      transactions: state.transactions,
      prices: state.prices,
      addStock: (payload) => dispatch({ type: 'addStock', payload }),
      editBatch: (payload) => dispatch({ type: 'editBatch', payload }),
      deleteBatch: (payload) => dispatch({ type: 'deleteBatch', payload }),
      deleteProduct: (productId) => dispatch({ type: 'deleteProduct', payload: { productId } }),
      checkout: (payload) => dispatch({ type: 'checkout', payload }),
      togglePaid: (transactionId) =>
        dispatch({ type: 'togglePaid', payload: { transactionId } }),
      voidTransaction: (transactionId) =>
        dispatch({ type: 'voidTransaction', payload: { transactionId } }),
      setPrice: (payload) => dispatch({ type: 'setPrice', payload }),
      clearData: () => dispatch({ type: 'clear' }),
    }),
    [state, dispatch],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside <StoreProvider>')
  return context
}
