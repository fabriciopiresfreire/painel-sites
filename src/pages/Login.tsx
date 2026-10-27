import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInEmail, signUpEmail, signInGoogle, ready } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!ready) {
      navigate('/')
      return
    }
    setCarregando(true)
    const fn = modo === 'entrar' ? signInEmail : signUpEmail
    const { error } = await fn(email, senha)
    setCarregando(false)
    if (error) setErro(error)
    else navigate('/')
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-600 bg-ink-800 p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white font-bold">
            S
          </div>
          <span className="text-xl font-semibold text-white">Painel Sites</span>
        </div>

        <h1 className="mb-1 text-lg font-semibold text-white">
          {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          {modo === 'entrar'
            ? 'Acesse para gerenciar seus sites.'
            : 'Cadastre-se para começar.'}
        </p>

        {!ready && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Supabase ainda não configurado — qualquer clique entra em modo de
            desenvolvimento.
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
          />
          {erro && <div className="text-xs text-red-400">{erro}</div>}
          <button
            type="submit"
            disabled={carregando}
            className="rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
          >
            {carregando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          onClick={() => (ready ? signInGoogle() : navigate('/'))}
          className="mt-3 w-full rounded-lg border border-ink-600 bg-ink-700 py-2.5 text-sm font-medium text-white transition hover:bg-ink-600"
        >
          Continuar com Google
        </button>

        <button
          onClick={() => setModo(modo === 'entrar' ? 'criar' : 'entrar')}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-brand-400"
        >
          {modo === 'entrar'
            ? 'Não tem conta? Criar agora'
            : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
