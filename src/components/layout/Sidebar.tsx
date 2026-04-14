'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bus, LayoutDashboard, Users, CreditCard, 
  BedDouble, CheckSquare, MessageSquare, 
  Upload, LogOut, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/viajes', icon: Bus, label: 'Viajes' },
  { href: '/admin/viajeros', icon: Users, label: 'Viajeros' },
  { href: '/admin/pagos', icon: CreditCard, label: 'Pagos' },
  { href: '/admin/cuartos', icon: BedDouble, label: 'Cuartos' },
  { href: '/admin/tareas', icon: CheckSquare, label: 'Tareas' },
  { href: '/admin/mensajes', icon: MessageSquare, label: 'Mensajes' },
  { href: '/admin/importar', icon: Upload, label: 'Importar Excel' },
]

interface SidebarProps {
  userName?: string
  userRol?: string
}

export default function Sidebar({ userName = 'Usuario', userRol = 'staff' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-none">TravelDesk</p>
            <p className="text-xs text-gray-400 mt-0.5">Agencia de Viajes</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-4.5 h-4.5 flex-shrink-0', active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')} />
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
