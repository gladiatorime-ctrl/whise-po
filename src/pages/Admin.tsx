import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Report, Shop } from '@/types'

export default function Admin() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [shops, setShops] = useState<Shop[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*, products(title), profiles(name)').order('created_at', { ascending: false }),
    ])
    setShops((s as Shop[]) ?? [])
    setReports((r as Report[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (!user) {
    navigate('/auth')
    return null
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Эта страница доступна только администраторам.
      </div>
    )
  }

  const verify = async (shop: Shop) => {
    const { error } = await supabase.from('shops').update({ verified: true, requested: false }).eq('id', shop.id)
    if (error) {
      toast.error(error.message)
      return
    }
    await supabase.from('notifications').insert({
      user_id: shop.owner_id,
      text: `Поздравляем! Магазин «${shop.name}» прошёл верификацию.`,
    })
    toast.success('Магазин верифицирован')
    load()
  }

  const closeReport = async (report: Report) => {
    const { error } = await supabase.from('reports').update({ done: true }).eq('id', report.id)
    if (error) toast.error(error.message)
    else load()
  }

  const requested = shops.filter((s) => s.requested && !s.verified)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold mb-6">Панель администратора</h1>

      <Tabs defaultValue="shops">
        <TabsList className="mb-6">
          <TabsTrigger value="shops">
            Магазины{requested.length > 0 ? ` (${requested.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="reports">
            Жалобы{reports.filter((r) => !r.done).length > 0 ? ` (${reports.filter((r) => !r.done).length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shops">
          {loading ? (
            <p className="text-muted-foreground">Загрузка…</p>
          ) : shops.length === 0 ? (
            <p className="text-muted-foreground">Магазинов пока нет.</p>
          ) : (
            <ul className="divide-y border bg-card">
              {shops.map((s) => (
                <li key={s.id} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {s.address || 'адрес не указан'} · {s.phone || 'телефон не указан'}
                    </div>
                  </div>
                  {s.verified ? (
                    <span className="text-xs px-2 py-1 border border-primary text-primary">Верифицирован</span>
                  ) : s.requested ? (
                    <>
                      <span className="text-xs px-2 py-1 border text-muted-foreground">Ожидает проверки</span>
                      <Button size="sm" onClick={() => verify(s)}>
                        <ShieldCheck className="h-4 w-4 mr-1" /> Верифицировать
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs px-2 py-1 border text-muted-foreground">Не верифицирован</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="reports">
          {reports.length === 0 ? (
            <p className="text-muted-foreground">Жалоб пока нет.</p>
          ) : (
            <ul className="divide-y border bg-card">
              {reports.map((r) => (
                <li key={r.id} className={`p-4 ${r.done ? 'opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {r.products?.title ?? 'Товар удалён'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        От: {r.profiles?.name ?? 'аноним'} ·{' '}
                        {new Date(r.created_at).toLocaleString('ru-RU')}
                      </div>
                      <p className="text-sm mt-1">{r.reason}</p>
                    </div>
                    {!r.done && (
                      <Button size="sm" variant="outline" onClick={() => closeReport(r)}>
                        Закрыть
                      </Button>
                    )}
                    {r.done && <span className="text-xs text-muted-foreground">Обработано</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
