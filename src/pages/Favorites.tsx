import { useEffect, useState } from 'react'
import { HeartOff } from 'lucide-react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'

export default function Favorites() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('favorites')
      .select('products(*, shops(name, verified), product_photos(id, url, position))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const items = (data ?? [])
      .map((f) => f.products as unknown as Product)
      .filter(Boolean)
    setProducts(items)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">
        <p className="mb-4">Войдите, чтобы видеть избранное.</p>
        <Link to="/auth" className="text-primary hover:underline">
          Войти или зарегистрироваться
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold mb-6">Избранное</h1>
      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <HeartOff className="h-10 w-10" />
          <p>Пока пусто. Добавьте товары из каталога.</p>
          <Link to="/catalog" className="text-primary hover:underline">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isFavorite onToggleFavorite={() => load()} />
          ))}
        </div>
      )}
    </div>
  )
}
