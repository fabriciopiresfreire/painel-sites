import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, Globe, Loader2, RefreshCw, Trash2, Link2 } from 'lucide-react'
import { listarSites } from '../lib/sites'
import {
  adicionarDominio,
  statusDominio,
  removerDominio,
  listarZonas,
  type Zona,
  type DominioUsado,
} from '../lib/dominios'
import type { Site } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export default function Dominios() {
  const { ready } = useAuth()
  const location = useLocation()
  const sitePre = (location.state as { site?: string } | null)?.site ?? ''

  const [sites, setSites] = useState<Site[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [usados, setUsados] = useState<DominioUsado[]>([])
  const [carregando, setCarregando] = useState(true)

  const [siteId, setSiteId] = useState(sitePre)
  const [zonaSel, setZonaSel] = useState('')
  const [subdominio, setSubdominio] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [ativo, setAtivo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const siteSel = sites.find((s) => s.id === siteId) ?? null
  const elegiveis = sites.filter((s) => s.status !== 'rascunho')

  // Domínio composto (apex ou subdomínio).
  const dominioComposto = useMemo(() => {
    if (!zonaSel) return ''
    const sub = subdominio.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    return sub ? `${sub}.${zonaSel}` : zonaSel
  }, [zonaSel, subdominio])

  const carregar = async () => {
    if (!ready) {
      setCarregando(false)
      return
    }
    try {
      const [s, z] = await Promise.all([listarSites(), listarZonas()])
      setSites(s)
      setZonas(z.zonas)
      setUsados(z.usados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Reflete o domínio já existente do site selecionado.
  useEffect(() => {
    if (siteSel?.custom_domain) {
      setAtivo(siteSel.status === 'ativo')
    } else {
      setAtivo(false)
    }
    setStatusMsg(null)
    setErro(null)
  }, [siteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Site que usa um domínio desta zona (apex ou subdomínio).
  const siteDaZona = (zona: string): DominioUsado | undefined =>
    usados.find((u) => u.custom_domain === zona || u.custom_domain.endsWith('.' + zona))

  const temDominio = Boolean(siteSel?.custom_domain)

  const vincular = async () => {
    setErro(null)
    if (!siteId) {
      setErro('Escolha o site primeiro.')
      return
    }
    if (!dominioComposto) {
      setErro('Escolha um domínio.')
      return
    }
    setOcupado(true)
    try {
      const r = await adicionarDominio(siteId, dominioComposto)
      setStatusMsg(r.instrucao)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao vincular.')
    } finally {
      setOcupado(false)
    }
  }

  const verificar = async () => {
    setErro(null)
    setOcupado(true)
    try {
      const r = await statusDominio(siteId)
      setAtivo(r.ativo)
      setStatusMsg(
        r.ativo
          ? 'Domínio ativo com SSL! Seu site já responde nele.'
          : r.instrucao ?? 'SSL ainda provisionando. Aguarde 1-2 min e verifique de novo.',
      )
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao verificar.')
    } finally {
      setOcupado(false)
    }
  }

  const remover = async () => {
    if (!confirm('Remover o domínio deste site?')) return
    setOcupado(true)
    try {
      await removerDominio(siteId)
      setZonaSel('')
      setSubdominio('')
      setAtivo(false)
      setStatusMsg(null)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-white">Domínios</h1>
      <p className="mt-1 text-sm text-slate-400">
        Conecte um domínio (ou subdomínio) da sua conta Cloudflare a um site. SSL automático.
      </p>

      {!ready && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Supabase não configurado.
        </div>
      )}

      {carregando ? (
        <div className="mt-10 grid place-items-center text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* SEUS DOMÍNIOS */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Seus domínios na Cloudflare
            </h2>
            {zonas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-600 bg-ink-800/50 p-6 text-center text-sm text-slate-400">
                Nenhum domínio na conta Cloudflare.{' '}
                <Link to="/comprar-dominio" className="text-brand-400 hover:underline">
                  Comprar um domínio
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {zonas.map((z) => {
                  const uso = siteDaZona(z.name)
                  return (
                    <div
                      key={z.name}
                      className="flex items-center justify-between rounded-xl border border-ink-600 bg-ink-800 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Globe size={18} className={uso ? 'text-emerald-400' : 'text-slate-500'} />
                        <div>
                          <div className="font-medium text-white">{z.name}</div>
                          {uso ? (
                            <div className="text-xs text-emerald-400">
                              {uso.custom_domain} → {uso.nome}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">
                              livre {z.status !== 'active' ? `· ${z.status}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setZonaSel(z.name)
                          setSubdominio('')
                          setErro(null)
                        }}
                        className="rounded-lg bg-ink-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-ink-600"
                      >
                        Usar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* VINCULAR */}
          {elegiveis.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-600 bg-ink-800/50 p-6 text-center text-sm text-slate-400">
              Publique um site primeiro para vincular um domínio.{' '}
              <Link to="/" className="text-brand-400 hover:underline">
                Meus Sites
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-600 bg-ink-800 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-medium text-white">
                <Link2 size={18} /> Vincular domínio a um site
              </h2>

              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Site</span>
                  <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="inp">
                    <option value="">Selecione...</option>
                    {elegiveis.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} {s.custom_domain ? `(${s.custom_domain})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                {temDominio ? (
                  <div className="flex items-center justify-between rounded-lg border border-ink-600 bg-ink-900 px-4 py-3">
                    <span className="text-sm text-slate-300">
                      Domínio atual: <strong className="text-white">{siteSel?.custom_domain}</strong>
                    </span>
                    <button
                      onClick={remover}
                      disabled={ocupado}
                      className="flex items-center gap-1.5 rounded-lg bg-ink-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 size={14} /> Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_1.4fr] gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-slate-300">
                          Subdomínio (opcional)
                        </span>
                        <input
                          value={subdominio}
                          onChange={(e) => setSubdominio(e.target.value)}
                          placeholder="ex.: promo"
                          className="inp"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-slate-300">
                          Domínio
                        </span>
                        <select
                          value={zonaSel}
                          onChange={(e) => setZonaSel(e.target.value)}
                          className="inp"
                        >
                          <option value="">Selecione...</option>
                          {zonas.map((z) => (
                            <option key={z.name} value={z.name}>
                              {z.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {dominioComposto && (
                      <div className="rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm text-slate-200">
                        Vai publicar em:{' '}
                        <strong className="text-brand-400">https://{dominioComposto}</strong>
                      </div>
                    )}

                    <button
                      onClick={vincular}
                      disabled={ocupado || !siteId || !dominioComposto}
                      className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
                    >
                      {ocupado ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                      {ocupado ? 'Vinculando...' : 'Vincular domínio'}
                    </button>
                  </>
                )}

                {temDominio && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={verificar}
                      disabled={ocupado}
                      className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-ink-700 disabled:opacity-40"
                    >
                      <RefreshCw size={16} className={ocupado ? 'animate-spin' : ''} />
                      Verificar SSL
                    </button>
                    {ativo && (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                        <Check size={16} /> Ativo
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {statusMsg && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                ativo
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
              }`}
            >
              {statusMsg}
            </div>
          )}
          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {erro}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
