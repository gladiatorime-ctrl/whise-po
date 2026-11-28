import { Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { I18nProvider } from '@/lib/i18n'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Catalog from '@/pages/Catalog'
import ProductPage from '@/pages/ProductPage'
import Auth from '@/pages/Auth'
import Favorites from '@/pages/Favorites'
import Notifications from '@/pages/Notifications'
import Profile from '@/pages/Profile'
import SellerShop from '@/pages/seller/SellerShop'
import SellerProducts from '@/pages/seller/SellerProducts'
import SellerProductEdit from '@/pages/seller/SellerProductEdit'
import Admin from '@/pages/Admin'

export default function App() {
  return (
    <I18nProvider>
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="auth" element={<Auth />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="seller" element={<SellerShop />} />
          <Route path="seller/products" element={<SellerProducts />} />
          <Route path="seller/products/:id" element={<SellerProductEdit />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </AuthProvider>
    </I18nProvider>
  )
}
