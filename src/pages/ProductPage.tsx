import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Heart, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { Product } from '@/types'

export default function ProductPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!id) return
    supabase
      .from('products')
      .select('*, shops(*), product_photos(*), product_sizes(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => setProduct(data as Product | null))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .then(({ data }) => setIsFavorite((data ?? []).length > 0))
  }, [user, id])

  if (!product) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Загрузка…</div>
  }

  const photos = [...(product.product_photos ?? [])].sort((a, b) => a.position - b.position)

  const toggleFavorite = async () => {
    if (!user) {
      toast.info('Войдите, чтобы добавлять в избранное')
      return
    }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id)
      setIsFavorite(false)
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id })
      if (error) toast.error('Не удалось добавить в избранное')
      else setIsFavorite(true)
    }
  }

  const sendReport = async () => {
    if (!reason.trim()) {
      toast.error('Опишите причину жалобы')
      return
    }
    const { error } = await supabase.from('reports').insert({
      product_id: product.id,
      user_id: user?.id ?? null,
      reason: reason.trim(),
    })
    if (error) toast.error('Не удалось отправить жалобу')
    else {
      toast.success('Жалоба отправлена')
      setReportOpen(false)
      setReason('')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square border bg-secondary overflow-hidden">
            {photos[activePhoto] ? (
              <img src={photos[activePhoto].url} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Нет фото</div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-2 flex gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActivePhoto(i)}
                  className={`h-16 w-16 border overflow-hidden ${i === activePhoto ? 'border-foreground' : 'opacity-70'}`}
                  aria-label={`Фото ${i + 1}`}
                >
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            {product.gender && <Badge variant="secondary">{product.gender}</Badge>}
            {product.season && <Badge variant="secondary">{product.season}</Badge>}
          </div>

          <h1 className="font-display text-3xl font-semibold leading-tight">{product.title}</h1>
          <div className="text-2xl font-semibold">{formatPrice(product.price)}</div>

          {(product.product_sizes?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Размеры в наличии</h2>
              <div className="flex flex-wrap gap-2">
                {product.product_sizes!
                  .filter((s) => s.qty > 0)
                  .map((s) => (
                    <span key={s.size} className="border px-3 py-1.5 text-sm">
                      {s.size} · {s.qty} шт.
                    </span>
                  ))}
              </div>
            </div>
          )}

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold mb-1">Описание</h2>
              <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={toggleFavorite} variant={isFavorite ? 'default' : 'outline'}>
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'В избранном' : 'В избранное'}
            </Button>
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground">
                  Пожаловаться
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Жалоба на товар</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Опишите проблему…"
                    rows={4}
                  />
                  <Button onClick={sendReport} className="w-full">
                    Отправить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {product.shops && (
            <div className="border p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                {product.shops.name}
                {product.shops.verified && (
                  <Badge className="gap-1">
                    <ShieldCheck className="h-3 w-3" /> Проверен
                  </Badge>
                )}
              </div>
              {product.shops.about && <p className="text-sm text-muted-foreground">{product.shops.about}</p>}
              {product.shops.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {product.shops.address}
                </div>
              )}
              {product.shops.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /> {product.shops.phone}
                </div>
              )}
            </div>
          )}

          <div>
            <Link to="/catalog" className="text-sm text-primary hover:underline">
              ← Назад в каталог
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
