import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Bell, Heart, LayoutGrid, LogOut, Shield, ShoppingBag, Store, UserRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
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

  const handleSignOut = () => {
    setProfileOpen(false)
    signOut()
    navigate('/')
  }

  const displayName = profile?.name?.trim() || user?.email?.split('@')[0] || 'Профиль'

  const desktopLinks = (
    <>
      <NavLink to="/catalog" className={navCls}>
        Каталог
      </NavLink>
      {user && (
        <>
          <NavLink to="/favorites" className={navCls}>
            Избранное
          </NavLink>
          <NavLink to="/notifications" className={navCls}>
            Уведомления
            {unread > 0 && <span className="ml-1 font-semibold text-primary">({unread})</span>}
          </NavLink>
        </>
      )}
      {isAdmin && (
        <NavLink to="/admin" className={navCls}>
          Админка
        </NavLink>
      )}
    </>
  )

  const tabs = [
    { to: '/catalog', label: 'Каталог', icon: LayoutGrid },
    ...(user
      ? [
          { to: '/favorites', label: 'Избранное', icon: Heart },
          { to: '/notifications', label: 'События', icon: Bell, badge: unread },
          ...(isAdmin
            ? [{ to: '/admin', label: 'Админка', icon: Shield }]
            : [{ to: '/seller', label: 'Кабинет', icon: Store }]),
          { to: '/profile', label: 'Профиль', icon: UserRound },
        ]
      : [{ to: '/auth', label: 'Войти', icon: UserRound }]),
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="На главную">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-semibold tracking-tight">Рынок</span>
            </Link>

            <nav className="ml-auto hidden items-center gap-5 text-sm font-medium lg:flex">
              {desktopLinks}
            </nav>

            <div className="ml-auto flex items-center gap-2 lg:ml-4">
              {user ? (
                <div className="relative z-40 hidden sm:block">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                  >
                    <UserRound className="mr-1.5 h-4 w-4" />
                    <span className="max-w-[9rem] truncate">{displayName}</span>
                  </Button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-40 mt-2 w-52 rounded-md border bg-popover p-1 shadow-md"
                      >
                        <Link
                          to="/profile"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <UserRound className="h-4 w-4" />
                          Профиль
                        </Link>
                        {!isAdmin && (
                          <Link
                            to="/seller"
                            role="menuitem"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <Store className="h-4 w-4" />
                            Кабинет продавца
                          </Link>
                        )}
                        <button
                          role="menuitem"
                          onClick={handleSignOut}
                          className="mt-1 flex w-full items-center gap-2 rounded-sm border-t px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                        >
                          <LogOut className="h-4 w-4" />
                          Выйти
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button size="sm" asChild>
                  <Link to="/auth">Войти</Link>
                </Button>
              )}

              <Link
                to={user ? '/profile' : '/auth'}
                aria-label={user ? 'Профиль' : 'Войти'}
                className="rounded-md p-2 hover:bg-accent sm:hidden"
              >
                <UserRound className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      <footer className="mt-12 border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
          <span className="font-display text-base font-semibold text-foreground">Рынок</span>
          <span>Маркетплейс для продавцов и покупателей</span>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Основная навигация"
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                'relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ' +
                (isActive ? 'text-primary' : 'text-muted-foreground')
              }
            >
              <t.icon className="h-5 w-5" />
              {t.label}
              {'badge' in t && t.badge ? (
                <span className="absolute right-1/2 top-1 flex h-4 min-w-4 translate-x-3 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-1.5 rounded-md transition-colors hover:text-primary ${
    isActive ? 'text-primary font-semibold' : 'text-foreground'
  }`
