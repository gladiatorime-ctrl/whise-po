import { Link } from 'react-router'
import { ArrowRight, ShieldCheck, Store, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">
          Место, где продают и покупают
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Каталог товаров от независимых продавцов. Создайте магазин за пару минут или найдите то,
          что искали.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/catalog">
              Перейти в каталог <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/seller">Стать продавцом</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Store, title: 'Свой магазин', text: 'Оформите витрину, добавляйте товары с фото и размерами.' },
          { icon: ShieldCheck, title: 'Проверенные продавцы', text: 'Администрация проверяет магазины — покупайте уверенно.' },
          { icon: Tag, title: 'Умный каталог', text: 'Фильтры по категории, полу, сезону и цене.' },
        ].map((f) => (
          <div key={f.title} className="border bg-card p-6 space-y-2">
            <f.icon className="h-6 w-6 text-primary" />
            <h2 className="font-semibold">{f.title}</h2>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
