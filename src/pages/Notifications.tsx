import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BellOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/types'

export default function Notifications() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setItems((data as Notification[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    load()
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">
        <p className="mb-4">{t('notif.login')}</p>
        <Link to="/auth" className="text-primary hover:underline">
          {t('fav.loginLink')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold">{t('notif.title')}</h1>
        {items.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            {t('notif.readAll')}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <BellOff className="h-10 w-10" />
          <p>{t('notif.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y border bg-card">
          {items.map((n) => (
            <li key={n.id} className={`p-4 ${n.read ? '' : 'bg-secondary/60'}`}>
              <p className="text-sm">{n.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleString(locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
