import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Search, SearchX, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProductCard from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORIES, GENDERS, SEASONS, type Product } from '@/types'

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ' +
        (active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

export default function Catalog() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? 'all'
  const gender = params.get('gender') ?? 'all'
  const season = params.get('season') ?? 'all'
  const maxPrice = params.get('maxPrice') ?? ''

  const [qInput, setQInput] = useState(q)

  useEffect(() => {
    setQInput(q)
  }, [q])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== q) setParam('q', qInput)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, shops(name, verified), product_photos(id, url, position), product_sizes(size, qty)')
      .order('created_at', { ascending: false })

    if (q) query = query.ilike('title', `%${q}%`)
    if (category !== 'all') query = query.eq('category', category)
    if (gender !== 'all') query = query.eq('gender', gender)
    if (season !== 'all') query = query.eq('season', season)
    if (maxPrice) query = query.lte('price', Number(maxPrice))

    query.then(({ data }) => {
      setProducts((data as Product[]) ?? [])
      setLoading(false)
    })
  }, [q, category, gender, season, maxPrice, user])

  useEffect(() => {
    if (!user) {
      setFavorites(new Set())
      return
    }
    supabase.from('favorites').select('product_id').eq('user_id', user.id).then(({ data }) => {
      setFavorites(new Set((data ?? []).map((f) => f.product_id)))
    })
  }, [user, products.length])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeCount = useMemo(
    () =>
      (category !== 'all' ? 1 : 0) +
      (gender !== 'all' ? 1 : 0) +
      (season !== 'all' ? 1 : 0) +
      (maxPrice ? 1 : 0),
    [category, gender, season, maxPrice]
  )

  const resetFilters = () => {
    const next = new URLSearchParams(params)
    ;['category', 'gender', 'season', 'maxPrice'].forEach((k) => next.delete(k))
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-8">
      <h1 className="mb-5 font-display text-3xl font-semibold">Каталог</h1>

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b bg-background/95 px-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-2 pt-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="f-q"
              type="search"
              enterKeyHint="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Поиск по товарам…"
              aria-label="Поиск по товарам"
              className="h-10 pl-9 pr-9"
            />
            {qInput && (
              <button
                type="button"
                onClick={() => setQInput('')}
                aria-label="Очистить поиск"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
        </div>

        {/* Быстрые фильтры категорий */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-3 no-scrollbar">
          <Chip active={category === 'all'} onClick={() => setParam('category', 'all')}>
            Все
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setParam('category', c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchX className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Ничего не найдено</h2>
          <p className="mt-1 text-muted-foreground">Попробуйте изменить параметры поиска</p>
          {(q || activeCount > 0) && (
            <Button variant="outline" className="mt-4" onClick={() => { setQInput(''); resetFilters(); }}>
              Сбросить всё
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.has(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
