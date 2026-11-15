import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SearchX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProductCard from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, GENDERS, SEASONS, type Product } from '@/types'

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

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

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

  const filters = useMemo(
    () => (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1">
          <Label htmlFor="f-q" className="text-xs text-muted-foreground">Поиск</Label>
          <Input id="f-q" value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="Название…" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Категория</Label>
          <Select value={category} onValueChange={(v) => setParam('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Пол</Label>
          <Select value={gender} onValueChange={(v) => setParam('gender', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой</SelectItem>
              {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Сезон</Label>
          <Select value={season} onValueChange={(v) => setParam('season', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой</SelectItem>
              {SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="f-price" className="text-xs text-muted-foreground">Цена до, ₽</Label>
          <Input
            id="f-price"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setParam('maxPrice', e.target.value)}
            placeholder="не ограничено"
          />
        </div>
      </div>
    ),
    [q, category, gender, season, maxPrice]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold mb-6">Каталог</h1>
      <div className="mb-8">{filters}</div>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <SearchX className="h-10 w-10" />
          <p>Ничего не найдено. Попробуйте изменить фильтры.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">Найдено товаров: {products.length}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isFavorite={favorites.has(p.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
