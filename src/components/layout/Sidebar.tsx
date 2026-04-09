'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { BarChart2 } from 'lucide-react'
import { 
  Bus, LayoutDashboard, Users, CreditCard, 
  BedDouble, CheckSquare, MessageSquare, 
  Upload, LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/viajes', icon: Bus, label: 'Viajes' },
  { href: '/viajeros', icon: Users, label: 'Viajeros' },
  { href: '/pagos', icon: CreditCard, label: 'Pagos' },
  { href: '/cuartos', icon: BedDouble, label: 'Cuartos' },
  { href: '/tareas', icon: CheckSquare, label: 'Tareas' },
  { href: '/mensajes', icon: MessageSquare, label: 'Mensajes' },
  { href: "/importar", icon: Upload, label: "Importar" },
  { href: "/reportes", icon: BarChart2, label: "Reportes" },
]

const bottomNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/viajeros', icon: Users, label: 'Viajeros' },
  { href: '/pagos', icon: CreditCard, label: 'Pagos' },
  { href: '/cuartos', icon: BedDouble, label: 'Cuartos' },
]

interface SidebarProps {
  userName?: string
  userRol?: string
}

export default function Sidebar({ userName = 'Usuario', userRol = 'staff' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col z-50"
        style={{ background: 'linear-gradient(180deg, #06101f 0%, #1a3a6b 100%)' }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-center">
            <Image
              src="/blanco con negro.png"
              alt="Conecta Matamoros"
              width={160}
              height={60}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  active
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                style={active ? { background: 'rgba(201,162,39,0.25)', borderLeft: '3px solid #c9a227' } : {}}>
                <Icon className={clsx('w-4 h-4 flex-shrink-0', active ? 'text-yellow-400' : 'text-white/50')} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-yellow-400" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,162,39,0.3)', border: '1px solid #c9a227' }}>
              <span className="text-xs font-bold text-yellow-400">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-white/50 capitalize">{userRol}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #06101f, #1a3a6b)' }}>
        <Image
          src="/blanco con negro.png"
          alt="Conecta Matamoros"
          width={120}
          height={40}
          className="object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-white rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #06101f 0%, #1a3a6b 100%)' }}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(201,162,39,0.3)', border: '1px solid #c9a227' }}>
                  <span className="text-sm font-bold text-yellow-400">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-white/50 capitalize">{userRol}</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link key={href} href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      active ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                    style={active ? { background: 'rgba(201,162,39,0.2)' } : {}}>
                    <Icon className={clsx('w-5 h-5', active ? 'text-yellow-400' : 'text-white/50')} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-3 border-t border-white/10">
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 rounded-xl hover:bg-red-500/10">
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 flex items-center justify-around border-t border-white/10"
        style={{ background: 'linear-gradient(135deg, #06101f, #1a3a6b)' }}>
        {bottomNavItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[56px]">
              <Icon className={clsx('w-6 h-6', active ? 'text-yellow-400' : 'text-white/50')} />
              <span className={clsx('text-xs font-medium', active ? 'text-yellow-400' : 'text-white/50')}>{label}</span>
            </Link>
          )
        })}
        <button onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-white/50 min-w-[56px]">
          <Menu className="w-6 h-6" />
          <span className="text-xs font-medium">Más</span>
        </button>
      </nav>
    </>
  )
}
