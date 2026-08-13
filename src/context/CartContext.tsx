import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { CartLine, Product } from '@/lib/types'

const STORAGE_KEY = 'atelier-terre-cart-v1'

interface CartState {
  lines: CartLine[]
}

type Action =
  | { type: 'ADD'; product: Product; quantity: number }
  | { type: 'SET_QTY'; productId: string; quantity: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; lines: CartLine[] }

function clamp(qty: number, max: number, stock: number) {
  return Math.max(1, Math.min(qty, max, stock))
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { lines: action.lines }

    case 'ADD': {
      const { product, quantity } = action
      const cap = Math.min(product.max_per_order, product.stock)
      const existing = state.lines.find((l) => l.productId === product.id)
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.productId === product.id
              ? { ...l, quantity: clamp(l.quantity + quantity, cap, product.stock) }
              : l,
          ),
        }
      }
      const image = product.images?.[0]?.url ?? null
      const line: CartLine = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.price_cents,
        image,
        quantity: clamp(quantity, cap, product.stock),
        maxPerOrder: product.max_per_order,
        stock: product.stock,
      }
      return { lines: [...state.lines, line] }
    }

    case 'SET_QTY':
      return {
        lines: state.lines.map((l) =>
          l.productId === action.productId
            ? { ...l, quantity: clamp(action.quantity, l.maxPerOrder, l.stock) }
            : l,
        ),
      }

    case 'REMOVE':
      return { lines: state.lines.filter((l) => l.productId !== action.productId) }

    case 'CLEAR':
      return { lines: [] }

    default:
      return state
  }
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotalCents: number
  addItem: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] })

  // Restauration depuis localStorage au montage — le panier survit à la navigation.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'HYDRATE', lines: JSON.parse(raw) as CartLine[] })
    } catch {
      /* panier corrompu → on repart d'un panier vide */
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines))
  }, [state.lines])

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0)
    const subtotalCents = state.lines.reduce((n, l) => n + l.priceCents * l.quantity, 0)
    return {
      lines: state.lines,
      count,
      subtotalCents,
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD', product, quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: 'SET_QTY', productId, quantity }),
      removeItem: (productId) => dispatch({ type: 'REMOVE', productId }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }
  }, [state.lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans un <CartProvider>')
  return ctx
}
