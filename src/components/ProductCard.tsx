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
  const photo = [...(product.product_photos ?? [])].sort((a, b) => a.position - b.position)[0]

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
      className="group flex flex-col overflow-hidden border bg-card transition-colors hover:border-foreground"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary">
        {photo ? (
          <img
            src={photo.url}
            alt={product.title}
            className="absolute inset-0 block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Нет фото
          </div>
        )}

        {product.shops?.verified && (
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-tight text-primary-foreground">
            Проверенный
          </span>
        )}

        <button
          onClick={toggle}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          className="absolute right-2 top-2 z-10 rounded-full border bg-card/90 p-2 transition-colors hover:border-foreground"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
          {product.title}
        </div>
        {product.shops?.name && (
          <div className="truncate text-xs text-muted-foreground">{product.shops.name}</div>
        )}
        <div className="mt-auto pt-2 text-sm font-medium tabular-nums">
          {formatPrice(product.price)}
        </div>
      </div>
    </Link>
  )
}
