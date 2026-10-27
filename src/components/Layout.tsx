import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LayoutGrid, Globe, PlusCircle, LogOut, Settings, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/', label: 'Meus Sites', icon: LayoutGrid, end: true },
  { to: '/criar', label: 'Criar Site', icon: PlusCircle, end: false },
  { to: '/comprar-dominio', label: 'Comprar Domínio', icon: ShoppingCart, end: false },
  { to: '/dominios', label: 'Domínios', icon: Globe, end: false },
  { to: '/conta', label: 'Conta', icon: Settings, end: false },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut, ready } = useAuth()
  const navigate = useNavigate()

  const sair = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-ink-900 text-slate-200">
      <aside className="flex w-60 flex-col border-r border-ink-600 bg-ink-800 p-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white font-bold">
            S
          </div>
          <span className="text-lg font-semibold text-white">Painel Sites</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-slate-400 hover:bg-ink-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-ink-600 pt-3">
          {ready && user && (
            <div className="mb-2 truncate px-3 text-xs text-slate-500">{user.email}</div>
          )}
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-ink-700 hover:text-white"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
