import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Loader2, Check, X, ShoppingCart, AlertTriangle } from 'lucide-react'
import {
  buscarDominios,
  checarDominios,
  comprarDominio,
  type DominioResultado,
  type Contato,
} from '../lib/registrar'
import { useAuth } from '../context/AuthContext'

const contatoVazio: Contato = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'BR',
  organization: '',
}

export default function ComprarDominio() {
  const { ready } = useAuth()
  const [q, setQ] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<DominioResultado[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<DominioResultado | null>(null) // domínio em compra
  const [contato, setContato] = useState<Contato>({ ...contatoVazio })
  const [confirmacao, setConfirmacao] = useState('')
  const [comprando, setComprando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    if (!q.trim()) return
    setBuscando(true)
    try {
      // Busca sugestões e re-checa autoritativamente (preço confiável).
      const sugestoes = await buscarDominios(q.trim())
      const nomes = sugestoes.slice(0, 20).map((d) => d.name)
      const checados = nomes.length ? await checarDominios(nomes) : []
      // Mescla: usa o check (autoritativo) como fonte de verdade.
      setResultados(checados.length ? checados : sugestoes)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro na busca.')
    } finally {
      setBuscando(false)
    }
  }

  const setC = (campo: keyof Contato, v: string) => setContato((c) => ({ ...c, [campo]: v }))

  const comprar = async () => {
    if (!alvo?.pricing) return
    setErro(null)
    if (!contatoCompleto) {
      setErro('Preencha todos os dados do titular antes de comprar.')
      return
    }
    if (confirmacao !== alvo.name) {
      setErro(`Digite exatamente "${alvo.name}" no campo de confirmação.`)
      return
    }
    setComprando(true)
    try {
      const r = await comprarDominio({
        dominio: alvo.name,
        preco_ok: alvo.pricing.registration_cost,
        contato,
        anos: 1,
      })
      setSucesso(`Domínio ${r.dominio} — ${r.estado}. Agora é só vincular a um site.`)
      setAlvo(null)
      setConfirmacao('')
      setResultados((rs) => rs.filter((d) => d.name !== r.dominio))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro na compra.')
    } finally {
      setComprando(false)
    }
  }

  const contatoCompleto =
    contato.first_name &&
    contato.last_name &&
    contato.email &&
    contato.phone &&
    contato.address &&
    contato.city &&
    contato.state &&
    contato.zip &&
    contato.country

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-white">Comprar domínio</h1>
      <p className="mt-1 text-sm text-slate-400">
        Busque, escolha e registre um domínio direto pela Cloudflare. Ao comprar, ele já
        fica disponível na sua conta para vincular a um site.
      </p>

      {!ready && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Supabase não configurado.
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300/90">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>
          A compra é cobrada no método de pagamento da sua conta Cloudflare e é{' '}
          <strong>não reembolsável</strong>. Domínios premium não são vendidos por aqui.
        </span>
      </div>

      <form onSubmit={buscar} className="mt-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: minhamarca, ou minhamarca.com"
          className="inp"
        />
        <button
          type="submit"
          disabled={buscando || !q.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
        >
          {buscando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Buscar
        </button>
      </form>

      {sucesso && (
        <div className="mt-5 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span>{sucesso}</span>
          <Link to="/dominios" className="font-medium underline">
            Ir para Domínios
          </Link>
        </div>
      )}
      {erro && (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="mt-6 space-y-2">
          {resultados.map((d) => {
            const disp = d.registrable
            return (
              <div
                key={d.name}
                className="flex items-center justify-between rounded-xl border border-ink-600 bg-ink-800 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  {disp ? (
                    <Check size={18} className="text-emerald-400" />
                  ) : (
                    <X size={18} className="text-slate-600" />
                  )}
                  <div>
                    <div className={disp ? 'font-medium text-white' : 'text-slate-500 line-through'}>
                      {d.name}
                    </div>
                    {!disp && (
                      <div className="text-xs text-slate-600">
                        indisponível{d.reason ? ` (${d.reason})` : ''}
                      </div>
                    )}
                    {disp && d.tier === 'premium' && (
                      <div className="text-xs text-amber-400">premium — não vendido por aqui</div>
                    )}
                  </div>
                </div>

                {disp && d.pricing && d.tier !== 'premium' && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {d.pricing.currency} {d.pricing.registration_cost}
                      </div>
                      <div className="text-xs text-slate-500">
                        renova {d.pricing.currency} {d.pricing.renewal_cost}/ano
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAlvo(d)
                        setConfirmacao('')
                        setErro(null)
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                    >
                      <ShoppingCart size={16} /> Comprar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de compra */}
      {alvo && alvo.pricing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
          onClick={() => !comprando && setAlvo(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-ink-600 bg-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-ink-600 px-6 py-4">
              <h2 className="font-semibold text-white">Comprar {alvo.name}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Total: <strong className="text-white">
                  {alvo.pricing.currency} {alvo.pricing.registration_cost}
                </strong>{' '}
                · 1 ano · renovação automática · cobrança não reembolsável.
              </p>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
              <p className="mb-3 text-xs text-slate-500">
                Dados do titular (exigidos pelo registro). País em código ISO (ex.: BR).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input className="inp" placeholder="Nome" value={contato.first_name} onChange={(e) => setC('first_name', e.target.value)} />
                <input className="inp" placeholder="Sobrenome" value={contato.last_name} onChange={(e) => setC('last_name', e.target.value)} />
                <input className="inp col-span-2" placeholder="E-mail" value={contato.email} onChange={(e) => setC('email', e.target.value)} />
                <input className="inp" placeholder="Telefone (+5511...)" value={contato.phone} onChange={(e) => setC('phone', e.target.value)} />
                <input className="inp" placeholder="Organização (opcional)" value={contato.organization} onChange={(e) => setC('organization', e.target.value)} />
                <input className="inp col-span-2" placeholder="Endereço" value={contato.address} onChange={(e) => setC('address', e.target.value)} />
                <input className="inp" placeholder="Cidade" value={contato.city} onChange={(e) => setC('city', e.target.value)} />
                <input className="inp" placeholder="Estado (UF)" value={contato.state} onChange={(e) => setC('state', e.target.value)} />
                <input className="inp" placeholder="CEP" value={contato.zip} onChange={(e) => setC('zip', e.target.value)} />
                <input className="inp" placeholder="País (BR)" value={contato.country} onChange={(e) => setC('country', e.target.value.toUpperCase())} />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm text-slate-300">
                  Para confirmar, digite o domínio: <strong>{alvo.name}</strong>
                </label>
                <input
                  className="inp"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value.toLowerCase().trim())}
                  placeholder={alvo.name}
                />
              </div>

              {erro && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {erro}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-ink-600 px-6 py-4">
              <button
                onClick={() => setAlvo(null)}
                disabled={comprando}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-ink-700"
              >
                Cancelar
              </button>
              <button
                onClick={comprar}
                disabled={comprando}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
              >
                {comprando ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                {comprando ? 'Comprando...' : `Comprar por ${alvo.pricing.currency} ${alvo.pricing.registration_cost}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
