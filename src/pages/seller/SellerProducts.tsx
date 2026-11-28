import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/components/ProductCard'
import type { Product, Shop } from '@/types'

export default function SellerProducts() {
  const { user } = useAuth()
  const { t, tv } = useI18n()
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).maybeSingle()
    const s = shopData as Shop | null
    setShop(s)
    if (s) {
      const { data } = await supabase
        .from('products')
        .select('*, product_photos(id, url, position)')
        .eq('shop_id', s.id)
        .order('created_at', { ascending: false })
      setProducts((data as Product[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!user) return <Navigate to="/auth" replace />

  if (!loading && !shop) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">{t('sp.needShop')}</p>
        <Button asChild>
          <Link to="/seller">{t('sp.createShop')}</Link>
        </Button>
      </div>
    )
  }

  const remove = async (p: Product) => {
    if (!confirm(t('sp.confirmDelete', { title: p.title }))) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) toast.error(error.message)
    else {
      toast.success(t('sp.deleted'))
      load()
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold">{t('sp.title')}</h1>
        <Button asChild>
          <Link to="/seller/products/new">
            <Plus className="h-4 w-4 mr-2" /> {t('sp.new')}
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground py-8">{t('sp.empty')}</p>
      ) : (
        <ul className="divide-y border bg-card">
          {products.map((p) => {
            const photo = p.product_photos?.sort((a, b) => a.position - b.position)[0]
            return (
              <li key={p.id} className="flex items-center gap-4 p-3">
                <div className="h-16 w-16 border bg-secondary shrink-0 overflow-hidden">
                  {photo && <img src={photo.url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(p.price)} · {tv('cat', p.category)}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 border ${p.published ? 'border-primary text-primary' : 'text-muted-foreground'}`}
                >
                  {p.published ? t('sp.published') : t('sp.draft')}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/seller/products/${p.id}`}>{t('sp.edit')}</Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(p)}>
                  {t('sp.delete')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
