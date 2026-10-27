import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Conta() {
  const { user, ready, updatePassword } = useAuth()
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const trocar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setOk(false)
    if (senha.length < 8) {
      setErro('A senha precisa ter ao menos 8 caracteres.')
      return
    }
    if (senha !== senha2) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    const { error } = await updatePassword(senha)
    setSalvando(false)
    if (error) setErro(error)
    else {
      setOk(true)
      setSenha('')
      setSenha2('')
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-white">Conta</h1>

      <div className="mt-6 rounded-xl border border-ink-600 bg-ink-800 p-6">
        <div className="text-sm text-slate-400">E-mail</div>
        <div className="mt-1 text-white">
          {ready ? user?.email ?? '—' : 'modo desenvolvimento'}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-ink-600 bg-ink-800 p-6">
        <h2 className="font-semibold text-white">Trocar senha</h2>
        <p className="mt-1 text-sm text-slate-400">
          Defina uma nova senha de acesso ao painel.
        </p>

        <form onSubmit={trocar} className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            placeholder="Nova senha (mín. 8 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="inp"
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Repita a nova senha"
            value={senha2}
            onChange={(e) => setSenha2(e.target.value)}
            className="inp"
            autoComplete="new-password"
          />

          {erro && <div className="text-sm text-red-400">{erro}</div>}
          {ok && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check size={16} /> Senha alterada com sucesso.
            </div>
          )}

          <button
            type="submit"
            disabled={salvando || !ready}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
          >
            {salvando ? <Loader2 size={16} className="animate-spin" /> : null}
            {salvando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
