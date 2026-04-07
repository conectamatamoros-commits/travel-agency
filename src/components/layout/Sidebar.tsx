'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  { href: '/importar', icon: Upload, label: 'Importar' },
]

// Items que aparecen en la barra inferior del celular (los más usados)
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
      {/* ===== DESKTOP SIDEBAR (oculto en móvil) ===== */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col z-50">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-none">Conecta Matamoros</p>
              <p className="text-xs text-gray-400 mt-0.5">Agencia de Viajes</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}>
                <Icon className={clsx('w-4 h-4 flex-shrink-0', active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-700">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-400 capitalize">{userRol}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <p className="font-bold text-gray-900 text-sm">Conecta Matamoros</p>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-700">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRol}</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
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
                      active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                    )}>
                    <Icon className={clsx('w-5 h-5', active ? 'text-brand-600' : 'text-gray-400')} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-3 border-t border-gray-100">
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-2 flex items-center justify-around">
        {bottomNavItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={clsx('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]',
                active ? 'text-brand-600' : 'text-gray-400'
              )}>
              <Icon className={clsx('w-6 h-6', active ? 'text-brand-600' : 'text-gray-400')} />
              <span className={clsx('text-xs font-medium', active ? 'text-brand-600' : 'text-gray-400')}>{label}</span>
            </Link>
          )
        })}
        {/* Más opciones */}
        <button onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-400 min-w-[56px]">
          <Menu className="w-6 h-6" />
          <span className="text-xs font-medium">Más</span>
        </button>
      </nav>
    </>
  )
}
