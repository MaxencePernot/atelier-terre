import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import Layout from '@/components/layout/Layout'

import Home from '@/pages/Home'
import Boutique from '@/pages/Boutique'
import ProductPage from '@/pages/ProductPage'
import CartPage from '@/pages/CartPage'
import Checkout from '@/pages/Checkout'
import Confirmation from '@/pages/Confirmation'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import LegalPage from '@/pages/LegalPage'
import NotFound from '@/pages/NotFound'

import Login from '@/pages/admin/Login'
import AdminLayout from '@/pages/admin/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import ProductsAdmin from '@/pages/admin/ProductsAdmin'
import ProductEdit from '@/pages/admin/ProductEdit'
import OrdersAdmin from '@/pages/admin/OrdersAdmin'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Site public ─────────────────────────────────────────── */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/boutique/:categorySlug" element={<Boutique />} />
              <Route path="/produit/:slug" element={<ProductPage />} />
              <Route path="/panier" element={<CartPage />} />
              <Route path="/commande" element={<Checkout />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/livraison" element={<LegalPage pageKey="livraison" />} />
              <Route path="/retours" element={<LegalPage pageKey="retours" />} />
              <Route path="/cgv" element={<LegalPage pageKey="cgv" />} />
              <Route path="/confidentialite" element={<LegalPage pageKey="confidentialite" />} />
              <Route path="/mentions-legales" element={<LegalPage pageKey="mentions-legales" />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ── Administration (séparée, protégée) ──────────────────── */}
            <Route path="/admin/connexion" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="produits" element={<ProductsAdmin />} />
              <Route path="produits/:id" element={<ProductEdit />} />
              <Route path="commandes" element={<OrdersAdmin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
