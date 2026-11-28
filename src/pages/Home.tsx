import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, Store, MessageCircle, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import ProductCard from '@/components/ProductCard'
import Snow, { isNewYearSeason } from '@/components/Snow'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*, shops(name, verified), product_photos(id, url, position), product_sizes(size, qty)')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setProducts((data as Product[]) ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!user) return setFavorites(new Set())
    supabase.from('favorites').select('product_id').eq('user_id', user.id).then(({ data }) =>
      setFavorites(new Set((data ?? []).map((f) => f.product_id)))
    )
  }, [user])

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : '/catalog')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-5 py-8 text-primary-foreground md:px-10 md:py-14 [&>*:not(canvas)]:relative">
        {isNewYearSeason() && <Snow />}
        <p className="mb-2 text-sm font-medium opacity-70">
          {t('home.region')}
          {isNewYearSeason() && <span> · ❄ {t('ny.greeting')}</span>}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
          {t('home.h1a')}<br className="hidden md:block" /> {t('home.h1b')}
        </h1>
        <p className="mt-3 max-w-xl opacity-80">
          {t('home.sub')}
        </p>
        <form onSubmit={submit} className="mt-6 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              enterKeyHint="search"
              placeholder={t('home.searchPh')}
              className="h-12 w-full rounded-xl bg-background pl-12 pr-3 text-foreground outline-none"
            />
          </div>
          <Button type="submit" size="lg" variant="secondary" className="h-12 rounded-xl px-6">
            {t('home.search')}
          </Button>
        </form>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">{t('home.new')}</h2>
          <Link to="/catalog" className="text-sm font-medium underline-offset-4 hover:underline">
            {t('home.allCatalog')}
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">{t('home.empty')}</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link to="/seller">{t('home.post')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={favorites.has(p.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { i: Search, title: t('home.s1t'), d: t('home.s1d') },
          { i: MapPin, title: t('home.s2t'), d: t('home.s2d') },
          { i: MessageCircle, title: t('home.s3t'), d: t('home.s3d') },
        ].map(({ i: Icon, title, d }) => (
          <div key={title} className="rounded-2xl border p-5">
            <Icon className="mb-3 h-6 w-6" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 flex flex-col items-start gap-3 rounded-3xl bg-secondary p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-display text-xl font-bold">{t('home.sellTitle')}</h2>
          <p className="text-muted-foreground">{t('home.sellText')}</p>
        </div>
        <Button asChild size="lg" className="rounded-xl">
          <Link to="/seller"><Store className="mr-2 h-4 w-4" /> {t('home.openShop')}</Link>
        </Button>
      </section>
    </div>
  )
}
