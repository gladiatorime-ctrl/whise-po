import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0))
  }, [user])

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : '/catalog')
    setMenuOpen(false)
  }

  const links = (
    <>
      <NavLink to="/catalog" onClick={() => setMenuOpen(false)} className={navCls}>
        Каталог
      </NavLink>
      {user && (
        <>
          <NavLink to="/favorites" onClick={() => setMenuOpen(false)} className={navCls}>
            Избранное
          </NavLink>
          <NavLink to="/notifications" onClick={() => setMenuOpen(false)} className={navCls}>
            Уведомления{unread > 0 && <span className="ml-1 text-primary font-semibold">({unread})</span>}
          </NavLink>
        </>
      )}
      {isAdmin && (
        <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={navCls}>
          Админка
        </NavLink>
      )}
    </>
  )

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="На главную">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-semibold tracking-tight">Рынок</span>
            </Link>

            <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md ml-6">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по товарам…"
                className="h-10"
                aria-label="Поиск по товарам"
              />
            </form>

            <nav className="ml-auto hidden lg:flex items-center gap-5 text-sm font-medium">{links}</nav>

            <div className="ml-auto lg:ml-4 flex items-center gap-2">
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={isAdmin ? '/admin' : '/seller'}>
                      <UserRound className="h-4 w-4 mr-1" />
                      {isAdmin ? 'Админка' : 'Кабинет продавца'}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut()
                      navigate('/')
                    }}
                  >
                    Выйти
                  </Button>
                </div>
              ) : (
                <Button size="sm" asChild>
                  <Link to="/auth">Войти</Link>
                </Button>
              )}
              <button
                className="lg:hidden p-2 rounded-md hover:bg-accent"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Меню"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="lg:hidden border-t py-3 space-y-3">
              <form onSubmit={onSearch} className="flex gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Поиск по товарам…"
                  aria-label="Поиск по товарам"
                />
                <Button type="submit" size="icon" variant="outline" aria-label="Искать">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <nav className="flex flex-col gap-1 text-sm font-medium">
                {links}
                {user && (
                  <>
                    <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={navCls}>
                      Профиль{profile?.name ? ` (${profile.name})` : ''}
                    </NavLink>
                    <button
                      className="text-left px-2 py-1.5 text-muted-foreground"
                      onClick={() => {
                        signOut()
                        setMenuOpen(false)
                        navigate('/')
                      }}
                    >
                      Выйти
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t mt-12">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground flex flex-wrap gap-4 items-center justify-between">
          <span className="font-display text-base font-semibold text-foreground">Рынок</span>
          <span>Маркетплейс для продавцов и покупателей</span>
        </div>
      </footer>
    </div>
  )
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-1.5 rounded-md transition-colors hover:text-primary ${
    isActive ? 'text-primary font-semibold' : 'text-foreground'
  }`
