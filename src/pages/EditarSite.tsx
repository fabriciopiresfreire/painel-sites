import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check, Eye, Loader2 } from 'lucide-react'
import CamposConteudo from '../components/CamposConteudo'
import { obterSite, atualizarSite } from '../lib/sites'
import { renderTemplate, templates } from '../lib/templates'
import { configVazio, type SiteConfig } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export default function EditarSite() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ready } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [template, setTemplate] = useState('basico')
  const [config, setConfig] = useState<SiteConfig>({ ...configVazio })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (!ready || !id) {
      setCarregando(false)
      return
    }
    obterSite(id)
      .then((s) => {
        if (!s) {
          setErro('Site não encontrado.')
          return
        }
        setNome(s.nome)
        setTemplate(s.template)
        setConfig({ ...configVazio, ...s.config })
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar.'))
      .finally(() => setCarregando(false))
  }, [id, ready])

  const set = (campo: keyof SiteConfig, valor: string) => {
    setConfig((c) => ({ ...c, [campo]: valor }))
    setSalvo(false)
  }

  const preencher = (parcial: Partial<SiteConfig>) => {
    setConfig((c) => ({ ...c, ...parcial }))
    setSalvo(false)
  }

  const salvar = async () => {
    if (!id) return
    setErro(null)
    setSalvando(true)
    try {
      await atualizarSite(id, { nome: nome.trim(), template, config })
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="grid place-items-center py-20 text-slate-500">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Voltar para Meus Sites
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Editar site</h1>
        <button
          onClick={salvar}
          disabled={salvando || !nome.trim() || !config.razaoSocial.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}{' '}
          <Link to="/" className="underline">
            voltar
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">
              Nome interno
            </span>
            <input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                setSalvo(false)
              }}
              className="inp"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Template</span>
            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value)
                setSalvo(false)
              }}
              className="inp"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>

          <CamposConteudo config={config} onChange={set} onPreencher={preencher} />
        </div>

        <div className="lg:sticky lg:top-10 lg:self-start">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Eye size={16} /> Pré-visualização
          </div>
          <div className="overflow-hidden rounded-xl border border-ink-600">
            <iframe
              title="preview"
              srcDoc={renderTemplate(template, config)}
              className="h-[560px] w-full bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
