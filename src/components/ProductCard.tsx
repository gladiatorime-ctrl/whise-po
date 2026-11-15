import { Link } from 'react-router'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
}

export default function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: {
  product: Product
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  const { user } = useAuth()
  const photo = product.product_photos?.sort((a, b) => a.position - b.position)[0]

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast.info('Войдите, чтобы добавлять в избранное')
      return
    }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id)
      onToggleFavorite(product.id)
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id })
      if (error) toast.error('Не удалось добавить в избранное')
      else onToggleFavorite(product.id)
    }
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block border bg-card overflow-hidden transition-colors hover:border-foreground"
    >
      <div className="aspect-square bg-secondary relative">
        {photo ? (
          <img
            src={photo.url}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Нет фото</div>
        )}
        <button
          onClick={toggle}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          className="absolute top-2 right-2 p-2 rounded-full bg-card/90 border hover:border-foreground transition-colors"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
        </button>
        {product.shops?.verified && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-sm">
            Проверенный магазин
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="font-medium leading-snug line-clamp-2">{product.title}</div>
        <div className="text-sm text-muted-foreground">{product.shops?.name}</div>
        <div className="pt-1 font-semibold">{formatPrice(product.price)}</div>
      </div>
    </Link>
  )
}
