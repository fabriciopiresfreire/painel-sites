import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Upload, Loader2, Trash2, ExternalLink, FileCheck2 } from 'lucide-react'
import { salvarVerificacaoMeta } from '../lib/sites'
import type { MetaVerificacao, Site } from '../lib/types'

export default function VerificacaoMeta({
  site,
  onClose,
  onSaved,
}: {
  site: Site
  onClose: () => void
  onSaved: (s: Site) => void
}) {
  const [lista, setLista] = useState<MetaVerificacao[]>(site.meta_verificacao ?? [])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const temDominio = Boolean(site.custom_domain)

  const salvar = async (nova: MetaVerificacao[]) => {
    setSalvando(true)
    setErro(null)
    setOk(null)
    try {
      const atualizado = await salvarVerificacaoMeta(site.id, nova)
      setLista(atualizado.meta_verificacao ?? nova)
      onSaved(atualizado)
      return true
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  const processarArquivo = async (file: File) => {
    setErro(null)
    setOk(null)
    const arquivo = file.name.trim()
    if (!/\.html?$/i.test(arquivo)) {
      setErro('Envie o arquivo .html que você baixou no Facebook.')
      return
    }
    let conteudo = ''
    try {
      conteudo = (await file.text()).trim()
    } catch {
      setErro('Não consegui ler o arquivo.')
      return
    }
    if (!conteudo) {
      setErro('O arquivo está vazio.')
      return
    }
    // Substitui se já existir um arquivo com o mesmo nome; senão adiciona.
    const nova = [...lista.filter((e) => e.arquivo !== arquivo), { arquivo, conteudo }]
    const sucesso = await salvar(nova)
    if (sucesso) setOk(`Arquivo "${arquivo}" no ar. Agora clique em Verificar domínio no Facebook.`)
  }

  const remover = async (arquivo: string) => {
    await salvar(lista.filter((e) => e.arquivo !== arquivo))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processarArquivo(file)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-600 px-5 py-3">
          <span className="flex items-center gap-2 font-medium text-white">
            <ShieldCheck size={18} className="text-brand-400" /> Verificação Meta — {site.nome}
          </span>
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Fechar
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <p className="text-sm text-slate-400">
            No Facebook (Configurações do Negócio → Domínios), escolha{' '}
            <strong className="text-slate-200">“Carregar um arquivo HTML”</strong>, baixe o arquivo
            e solte aqui. Ele passa a responder no seu domínio na hora — depois é só clicar em{' '}
            <strong className="text-slate-200">Verificar domínio</strong>.
          </p>

          {!temDominio ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              Este site ainda não tem um domínio próprio vinculado. Vincule um domínio primeiro em{' '}
              <Link to="/dominios" className="underline" onClick={onClose}>
                Domínios
              </Link>
              .
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-ink-600 bg-ink-900 px-4 py-2.5 text-xs text-slate-400">
                Domínio: <strong className="text-slate-200">{site.custom_domain}</strong>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setArrastando(true)
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={onDrop}
                className={`grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  arrastando
                    ? 'border-brand bg-brand/10'
                    : 'border-ink-600 bg-ink-900 hover:border-brand/50'
                }`}
              >
                {salvando ? (
                  <Loader2 className="animate-spin text-slate-400" />
                ) : (
                  <Upload size={24} className="text-slate-500" />
                )}
                <span className="text-sm text-slate-300">
                  Arraste o arquivo <strong>.html</strong> aqui ou clique para escolher
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".html,text/html"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) processarArquivo(f)
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Lista de arquivos já enviados */}
              {lista.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Arquivos no ar
                  </div>
                  {lista.map((e) => (
                    <div
                      key={e.arquivo}
                      className="flex items-center justify-between gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                        <FileCheck2 size={15} className="shrink-0 text-emerald-400" />
                        <span className="truncate">{e.arquivo}</span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={`https://${site.custom_domain}/${e.arquivo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Testar"
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-ink-700 hover:text-brand-400"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => remover(e.arquivo)}
                          disabled={salvando}
                          title="Remover"
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {ok && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {ok}
            </div>
          )}
          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {erro}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
