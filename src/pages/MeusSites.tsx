import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Globe, Eye, Trash2, Loader2, Rocket, Undo2, ExternalLink, Pencil, Link2, ShieldCheck } from 'lucide-react'
import { listarSites, excluirSite, publicarSite, urlPublica } from '../lib/sites'
import { renderTemplate } from '../lib/templates'
import { templatePorId } from '../lib/templates'
import type { Site, SiteStatus } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import VerificacaoMeta from '../components/VerificacaoMeta'

const rotuloStatus: Record<SiteStatus, { texto: string; cor: string }> = {
  rascunho: { texto: 'rascunho', cor: 'bg-slate-500/15 text-slate-400' },
  publicado: { texto: 'publicado', cor: 'bg-sky-500/15 text-sky-400' },
  dominio_pendente: { texto: 'domínio pendente', cor: 'bg-amber-500/15 text-amber-400' },
  ativo: { texto: 'ativo', cor: 'bg-emerald-500/15 text-emerald-400' },
}

export default function MeusSites() {
  const { ready } = useAuth()
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<Site | null>(null)
  const [verif, setVerif] = useState<Site | null>(null)

  const carregar = async () => {
    if (!ready) {
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      setSites(await listarSites())
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar sites.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const remover = async (site: Site) => {
    if (!confirm(`Excluir "${site.nome}"? Essa ação não pode ser desfeita.`)) return
    try {
      await excluirSite(site.id)
      setSites((s) => s.filter((x) => x.id !== site.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir.')
    }
  }

  const alternarPublicacao = async (site: Site) => {
    try {
      const atualizado = await publicarSite(site)
      setSites((s) => s.map((x) => (x.id === site.id ? atualizado : x)))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao publicar.')
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Meus Sites</h1>
          <p className="mt-1 text-sm text-slate-400">
            Crie e gerencie suas landing pages.
          </p>
        </div>
        <Link
          to="/criar"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
        >
          <PlusCircle size={18} strokeWidth={1.75} />
          Criar Site
        </Link>
      </div>

      {ready && !carregando && sites.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Tile rotulo="Total" valor={sites.length} />
          <Tile
            rotulo="Publicados"
            valor={sites.filter((s) => s.status !== 'rascunho').length}
          />
          <Tile
            rotulo="Com domínio"
            valor={sites.filter((s) => s.custom_domain).length}
          />
          <Tile rotulo="Ativos" valor={sites.filter((s) => s.status === 'ativo').length} />
        </div>
      )}

      {!ready && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Supabase não configurado — a lista fica vazia até ligar a chave no .env.
        </div>
      )}

      {erro && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="grid place-items-center py-20 text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      ) : sites.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink-600 bg-ink-800/50 py-20 text-center">
          <Globe size={40} strokeWidth={1.5} className="mb-4 text-slate-600" />
          <p className="text-slate-300">Você ainda não tem sites.</p>
          <p className="mt-1 text-sm text-slate-500">
            Clique em “Criar Site” para montar sua primeira landing page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const st = rotuloStatus[site.status]
            return (
              <div
                key={site.id}
                className="flex flex-col rounded-xl border border-ink-600 bg-ink-800 p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cor}`}
                  >
                    {st.texto}
                  </span>
                  <span className="text-xs text-slate-500">
                    {templatePorId(site.template).nome}
                  </span>
                </div>
                <h3 className="font-semibold text-white">{site.nome}</h3>
                <p className="mt-1 truncate text-sm text-slate-400">
                  {site.custom_domain || `${site.slug} (sem domínio)`}
                </p>

                {site.status !== 'rascunho' &&
                  (() => {
                    const link = urlPublica(site)
                    return link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 truncate text-xs text-brand-400 hover:underline"
                      >
                        <ExternalLink size={12} /> {link.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="mt-2 block text-xs text-slate-500">
                        publicado (defina VITE_WORKER_URL para o link)
                      </span>
                    )
                  })()}

                {site.status !== 'rascunho' && !site.custom_domain && (
                  <button
                    onClick={() => navigate('/dominios', { state: { site: site.id } })}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-400 hover:underline"
                  >
                    <Link2 size={12} /> Vincular domínio próprio
                  </button>
                )}

                {site.status !== 'rascunho' && (
                  <button
                    onClick={() => setVerif(site)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-400 hover:underline"
                  >
                    <ShieldCheck size={12} /> Verificação Meta
                    {site.meta_verificacao?.length ? (
                      <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 text-[10px] text-emerald-400">
                        {site.meta_verificacao.length}
                      </span>
                    ) : null}
                  </button>
                )}

                <div className="mt-4 flex gap-2 border-t border-ink-600 pt-4">
                  <button
                    onClick={() => alternarPublicacao(site)}
                    disabled={site.status === 'ativo' || site.status === 'dominio_pendente'}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition disabled:opacity-40 ${
                      site.status === 'rascunho'
                        ? 'bg-brand text-white hover:bg-brand-500'
                        : 'bg-ink-700 text-slate-200 hover:bg-ink-600'
                    }`}
                  >
                    {site.status === 'rascunho' ? (
                      <>
                        <Rocket size={15} /> Publicar
                      </>
                    ) : (
                      <>
                        <Undo2 size={15} /> Despublicar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/editar/${site.id}`)}
                    className="flex items-center justify-center rounded-lg bg-ink-700 px-3 py-2 text-slate-200 transition hover:bg-ink-600"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPreview(site)}
                    className="flex items-center justify-center rounded-lg bg-ink-700 px-3 py-2 text-slate-200 transition hover:bg-ink-600"
                    title="Pré-visualizar"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => remover(site)}
                    className="flex items-center justify-center rounded-lg bg-ink-700 px-3 py-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink-600 px-5 py-3">
              <span className="font-medium text-white">{preview.nome}</span>
              <button
                onClick={() => setPreview(null)}
                className="text-sm text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
            <iframe
              title="preview"
              srcDoc={renderTemplate(preview.template, preview.config)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
      )}

      {/* Modal de verificação Meta */}
      {verif && (
        <VerificacaoMeta
          site={verif}
          onClose={() => setVerif(null)}
          onSaved={(s) => {
            setSites((prev) => prev.map((x) => (x.id === s.id ? s : x)))
            setVerif(s)
          }}
        />
      )}
    </div>
  )
}

function Tile({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800 px-5 py-4">
      <div className="text-2xl font-semibold text-white">{valor}</div>
      <div className="mt-1 text-xs text-slate-400">{rotulo}</div>
    </div>
  )
}
