import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading, ready } = useAuth()

  // Sem infra ligada ainda: libera o acesso para desenvolver as telas.
  if (!ready) return <>{children}</>

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 text-brand-400">
        Carregando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
