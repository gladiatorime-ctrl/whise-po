import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { toast } from 'sonner'
import { ShieldCheck, ShieldQuestion, Store } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Shop } from '@/types'

export default function SellerShop() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [about, setAbout] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const s = data as Shop | null
        setShop(s)
        if (s) {
          setName(s.name)
          setAddress(s.address ?? '')
          setPhone(s.phone ?? '')
          setAbout(s.about ?? '')
        }
        setLoading(false)
      })
  }, [user])

  if (!user) return <Navigate to="/auth" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('shop.needName'))
      return
    }
    setBusy(true)
    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      about: about.trim() || null,
    }
    const { error } = shop
      ? await supabase.from('shops').update(payload).eq('id', shop.id)
      : await supabase.from('shops').insert({ ...payload, owner_id: user.id })
    setBusy(false)
    if (error) toast.error(error.message)
    else {
      toast.success(shop ? t('shop.updated') : t('shop.created'))
      if (!shop) window.location.reload()
    }
  }

  const requestVerification = async () => {
    if (!shop) return
    const { error } = await supabase.from('shops').update({ requested: true }).eq('id', shop.id)
    if (error) {
      toast.error(error.message)
      return
    }
    // Уведомляем администраторов
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map((a) => ({
          user_id: a.id,
          text: `Магазин «${shop.name}» запросил верификацию`,
        }))
      )
    }
    toast.success(t('shop.requestOk'))
    setShop({ ...shop, requested: true })
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-muted-foreground">{t('common.loading')}</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold">{t('shop.title')}</h1>
        {shop && (
          <Button variant="outline" asChild>
            <Link to="/seller/products">
              <Store className="h-4 w-4 mr-2" /> {t('shop.myProducts')}
            </Link>
          </Button>
        )}
      </div>

      {shop && (
        <div className="mb-6 border p-4 flex items-center gap-3 text-sm">
          {shop.verified ? (
            <>
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>{t('shop.verified')}</span>
            </>
          ) : shop.requested ? (
            <>
              <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
              <span>{t('shop.requestSent')}</span>
            </>
          ) : (
            <>
              <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1">{t('shop.notVerified')}</span>
              <Button size="sm" variant="outline" onClick={requestVerification}>
                {t('shop.requestBtn')}
              </Button>
            </>
          )}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="shop-name">{t('shop.name')}</Label>
          <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-address">{t('shop.address')}</Label>
          <Input id="shop-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('shop.addressPh')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-phone">{t('shop.phone')}</Label>
          <Input id="shop-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 …" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-about">{t('shop.about')}</Label>
          <Textarea id="shop-about" value={about} onChange={(e) => setAbout(e.target.value)} rows={4} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? t('common.saving') : shop ? t('shop.saveChanges') : t('shop.create')}
        </Button>
      </form>
    </div>
  )
}
