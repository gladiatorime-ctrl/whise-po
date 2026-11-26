import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(profile?.name ?? '')
  }, [profile])

  if (!user) {
    navigate('/auth')
    return null
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
    setBusy(false)
    if (error) toast.error('Не удалось сохранить')
    else {
      toast.success('Профиль обновлён')
      await refreshProfile()
    }
  }

  return (
    <> 
      {/* Обертка <> ... </> нужна, чтобы React не ругался на два блока подряд */}
      
      <div className="mx-auto max-w-sm px-4 pt-16 pb-4">
        <h1 className="font-display text-3xl font-semibold text-center mb-8">Профиль</h1>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email ?? ''} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="text-sm text-muted-foreground">
            Роль: {profile?.role === 'admin' ? 'администратор' : profile?.role === 'seller' ? 'продавец' : 'покупатель'}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </form>
      </div>
    </>
  )
}
