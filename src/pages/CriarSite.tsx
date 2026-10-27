import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { templates, renderTemplate } from '../lib/templates'
import { configVazio, type SiteConfig } from '../lib/types'
import { criarSite } from '../lib/sites'
import { useAuth } from '../context/AuthContext'
import CamposConteudo from '../components/CamposConteudo'

const passos = ['Template', 'Conteúdo', 'Revisão']

// Empresa fictícia só para a pré-visualização do template.
const configExemplo: SiteConfig = {
  razaoSocial: 'Empresa Exemplo Soluções Digitais LTDA',
  nomeFantasia: 'Empresa Exemplo',
  cnpj: '12.345.678/0001-90',
  dataAbertura: '2022-03-15',
  situacao: 'ATIVA',
  cidade: 'São Paulo',
  uf: 'SP',
  atividade: 'Serviços de tecnologia e marketing digital',
  servicos: [
    'Serviços de tecnologia e marketing digital',
    'Consultoria em publicidade',
    'Portais, provedores de conteúdo e outros serviços de informação na internet',
  ],
  endereco: 'Av. Paulista, 1000, Bela Vista, São Paulo-SP, CEP 01310-100',
  logradouro: 'Av. Paulista, 1000',
  cep: '01310100',
  porte: 'MICRO EMPRESA',
  naturezaJuridica: 'Sociedade Empresária Limitada',
  capitalSocial: 'R$ 50.000,00',
  tipo: 'MATRIZ',
  email: 'contato@empresaexemplo.com.br',
  telefone: '11999999999',
  whatsapp: '5511999999999',
  instagram: '@empresaexemplo',
  logoUrl: '',
  corPrimaria: '#2563eb',
  missao:
    'Oferecer soluções de alta qualidade, com ética, inovação e foco total na satisfação dos nossos clientes.',
  visao:
    'Ser referência no nosso segmento, reconhecida pela excelência, transparência e compromisso com resultados.',
  valores: 'Ética, transparência, inovação, respeito ao cliente e responsabilidade.',
}

export default function CriarSite() {
  const navigate = useNavigate()
  const { ready } = useAuth()
  const [passo, setPasso] = useState(0)
  const [template, setTemplate] = useState('basico')
  const [nome, setNome] = useState('')
  const [config, setConfig] = useState<SiteConfig>({ ...configVazio })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [verTemplate, setVerTemplate] = useState<string | null>(null)

  const set = (campo: keyof SiteConfig, valor: string) =>
    setConfig((c) => ({ ...c, [campo]: valor }))

  // Mescla vários campos de uma vez (usado pela busca de CNPJ).
  const preencher = (parcial: Partial<SiteConfig>) => {
    setConfig((c) => ({ ...c, ...parcial }))
    // Sugere o nome interno a partir da razão social, se ainda vazio.
    if (!nome.trim() && parcial.razaoSocial) setNome(parcial.razaoSocial)
  }

  const podeAvancar =
    (passo === 0 && template) ||
    (passo === 1 && nome.trim() && config.razaoSocial.trim() && config.email.trim()) ||
    passo === 2

  const salvar = async () => {
    setErro(null)
    if (!ready) {
      setErro('Supabase não configurado — não é possível salvar ainda.')
      return
    }
    setSalvando(true)
    try {
      const site = await criarSite({ nome: nome.trim(), template, config })
      navigate(`/`, { state: { criado: site.id } })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar o site.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Criar Site</h1>
      <p className="mt-1 text-sm text-slate-400">
        Monte sua landing page em três passos.
      </p>

      {/* Stepper */}
      <div className="mt-8 flex items-center gap-2">
        {passos.map((p, i) => (
          <div key={p} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                i < passo
                  ? 'bg-brand text-white'
                  : i === passo
                  ? 'bg-brand text-white ring-4 ring-brand/25'
                  : 'bg-ink-700 text-slate-500'
              }`}
            >
              {i < passo ? <Check size={16} /> : i + 1}
            </div>
            <span
              className={`text-sm ${i === passo ? 'text-white' : 'text-slate-500'}`}
            >
              {p}
            </span>
            {i < passos.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-ink-600" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {/* PASSO 1 — TEMPLATE */}
        {passo === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`cursor-pointer rounded-xl border p-5 transition ${
                  template === t.id
                    ? 'border-brand bg-brand/10'
                    : 'border-ink-600 bg-ink-800 hover:border-ink-500'
                }`}
              >
                <div
                  className="mb-3 h-20 rounded-lg"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${t.cor}55, transparent 70%), #0b0b12`,
                  }}
                />
                <div className="font-semibold text-white">{t.nome}</div>
                <div className="mt-1 text-xs text-slate-400">{t.descricao}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setVerTemplate(t.id)
                  }}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-ink-700"
                >
                  <Eye size={14} /> Ver template
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PASSO 2 — CONTEÚDO */}
        {passo === 1 && (
          <div className="grid max-w-xl gap-4">
            <Campo label="Nome interno do site" hint="Só você vê — para organizar.">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Site Águia Digital"
                className="inp"
              />
            </Campo>
            <CamposConteudo config={config} onChange={set} onPreencher={preencher} />
          </div>
        )}

        {/* PASSO 3 — REVISÃO + PREVIEW */}
        {passo === 2 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
              <Eye size={16} /> Pré-visualização ao vivo
            </div>
            <div className="overflow-hidden rounded-xl border border-ink-600">
              <iframe
                title="preview"
                srcDoc={renderTemplate(template, config)}
                className="h-[520px] w-full bg-white"
              />
            </div>
            {erro && <div className="mt-4 text-sm text-red-400">{erro}</div>}
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setPasso((p) => Math.max(0, p - 1))}
          disabled={passo === 0}
          className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-ink-700 disabled:opacity-40"
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        {passo < 2 ? (
          <button
            onClick={() => setPasso((p) => p + 1)}
            disabled={!podeAvancar}
            className="flex items-center gap-1 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
          >
            Avançar <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Criar site'} <Check size={18} />
          </button>
        )}
      </div>

      {/* Modal de pré-visualização do template */}
      {verTemplate && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
          onClick={() => setVerTemplate(null)}
        >
          <div
            className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink-600 px-5 py-3">
              <span className="font-medium text-white">
                Template: {templates.find((t) => t.id === verTemplate)?.nome}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTemplate(verTemplate)
                    setVerTemplate(null)
                  }}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500"
                >
                  Usar este
                </button>
                <button
                  onClick={() => setVerTemplate(null)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
            <iframe
              title="preview-template"
              srcDoc={renderTemplate(verTemplate, configExemplo)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
