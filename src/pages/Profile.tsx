import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(profile?.name ?? '')
  }, [profile])

  if (!user) return <Navigate to="/auth" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
    setBusy(false)
    if (error) toast.error(t('profile.saveFail'))
    else {
      toast.success(t('profile.saved'))
      await refreshProfile()
    }
  }

  const roleKey = profile?.role === 'admin' ? 'profile.role.admin' : profile?.role === 'seller' ? 'profile.role.seller' : 'profile.role.buyer'

  return (
    <div className="mx-auto max-w-sm px-4 pb-16 pt-16">
      <h1 className="mb-8 text-center font-display text-3xl font-semibold">{t('profile.title')}</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" value={user.email ?? ''} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="text-sm text-muted-foreground">{t('profile.role', { role: t(roleKey) })}</div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t('common.saving') : t('common.save')}
        </Button>
      </form>
    </div>
  )
}
