'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CalendarDays, ClipboardList, ShoppingBag, Users, Trophy, GraduationCap, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agendamento', label: 'Agendamento', icon: CalendarDays },
  { href: '/comandas', label: 'Comandas', icon: ClipboardList },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/produtos', label: 'Produtos', icon: ShoppingBag },
  { href: '/professores', label: 'Professores', icon: GraduationCap },
  { href: '/torneios', label: 'Torneios', icon: Trophy },
]

export function Nav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 bg-white dark:bg-zinc-900 border-r min-h-screen">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎾</span>
            <div>
              <p className="font-bold text-sm">Beach Tennis</p>
              <p className="text-xs text-muted-foreground">{userName}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t flex items-center justify-between">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </form>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎾</span>
          <span className="font-bold text-sm">Beach Tennis</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="absolute top-0 left-0 bottom-0 w-64 bg-white dark:bg-zinc-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b mt-14">
              <p className="text-xs text-muted-foreground">{userName}</p>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />
    </>
  )
}
