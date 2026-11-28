import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import ProductCard from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GENDERS, SEASONS, type Product } from '@/types'

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
  const { t, tv } = useI18n()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get('q') ?? ''
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
    if (gender !== 'all') query = query.eq('gender', gender)
    if (season !== 'all') query = query.eq('season', season)
    if (maxPrice) query = query.lte('price', Number(maxPrice))

    query.then(({ data }) => {
      setProducts((data as Product[]) ?? [])
      setLoading(false)
    })
  }, [q, gender, season, maxPrice, user])

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
      (gender !== 'all' ? 1 : 0) +
      (season !== 'all' ? 1 : 0) +
      (maxPrice ? 1 : 0),
    [gender, season, maxPrice]
  )

  const resetFilters = () => {
    const next = new URLSearchParams(params)
    ;['gender', 'season', 'maxPrice'].forEach((k) => next.delete(k))
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-8">
      <h1 className="mb-5 font-display text-3xl font-semibold">{t('catalog.title')}</h1>

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
              placeholder={t('catalog.search')}
              aria-label={t('catalog.search')}
              className="h-10 pl-9 pr-9"
            />
            {qInput && (
              <button
                type="button"
                onClick={() => setQInput('')}
                aria-label={t('catalog.clearSearch')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="relative h-10 w-10 shrink-0"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label={t('catalog.filters')}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </div>

        {/* Быстрый фильтр по полу */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-3 no-scrollbar">
          <Chip active={gender === 'all'} onClick={() => setParam('gender', 'all')}>
            {t('common.all')}
          </Chip>
          {GENDERS.map((g) => (
            <Chip key={g} active={gender === g} onClick={() => setParam('gender', g)}>
              {tv('gen', g)}
            </Chip>
          ))}
        </div>

        {/* Панель фильтров: сезон и цена */}
        {filtersOpen && (
          <div className="space-y-3 pb-2 pt-1">
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">{t('f.season')}</div>
              <div className="flex flex-wrap gap-2">
                <Chip active={season === 'all'} onClick={() => setParam('season', 'all')}>
                  {t('common.all')}
                </Chip>
                {SEASONS.map((s) => (
                  <Chip key={s} active={season === s} onClick={() => setParam('season', s)}>
                    {tv('sea', s)}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="w-40">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">{t('catalog.maxPrice')}</div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="h-10"
                />
              </div>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  {t('catalog.reset')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchX className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t('catalog.notFound')}</h2>
          <p className="mt-1 text-muted-foreground">{t('catalog.tryChange')}</p>
          {(q || activeCount > 0) && (
            <Button variant="outline" className="mt-4" onClick={() => { setQInput(''); resetFilters(); }}>
              {t('catalog.resetAll')}
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
