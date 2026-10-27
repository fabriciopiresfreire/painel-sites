import { useState } from 'react'
import { Search, Loader2, Check } from 'lucide-react'
import type { SiteConfig } from '../lib/types'
import { buscarCnpj, formatarCnpj, soDigitos } from '../lib/cnpj'

// Formulário do site institucional: CNPJ puxa os dados da empresa;
// e-mail e telefone são preenchidos manualmente.
export default function CamposConteudo({
  config,
  onChange,
  onPreencher,
}: {
  config: SiteConfig
  onChange: (campo: keyof SiteConfig, valor: string) => void
  onPreencher: (parcial: Partial<SiteConfig>) => void
}) {
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const buscar = async () => {
    setErro(null)
    setOk(false)
    if (soDigitos(config.cnpj).length !== 14) {
      setErro('Digite os 14 dígitos do CNPJ.')
      return
    }
    setBuscando(true)
    try {
      const dados = await buscarCnpj(config.cnpj)
      onPreencher(dados)
      setOk(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao buscar o CNPJ.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="grid gap-5">
      {/* CNPJ */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-300">
          CNPJ da empresa
        </span>
        <div className="flex gap-2">
          <input
            value={config.cnpj}
            onChange={(e) => onChange('cnpj', formatarCnpj(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscar())}
            placeholder="00.000.000/0001-00"
            className="inp"
          />
          <button
            type="button"
            onClick={buscar}
            disabled={buscando}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
          >
            {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Buscar dados
          </button>
        </div>
        {erro && <span className="mt-1 block text-xs text-red-400">{erro}</span>}
        {ok && (
          <span className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <Check size={13} /> Dados da empresa preenchidos.
          </span>
        )}
        <span className="mt-1 block text-xs text-slate-500">
          Puxa razão social, data de abertura, cidade e atividade direto da Receita.
        </span>
      </div>

      {/* Dados da empresa (auto, editáveis) */}
      <fieldset className="grid gap-4 rounded-xl border border-ink-600 p-4">
        <legend className="px-2 text-xs font-medium text-slate-400">
          Dados da empresa
        </legend>
        <Campo label="Razão social">
          <input value={config.razaoSocial} onChange={(e) => onChange('razaoSocial', e.target.value)} className="inp" />
        </Campo>
        <Campo label="Nome fantasia">
          <input value={config.nomeFantasia} onChange={(e) => onChange('nomeFantasia', e.target.value)} className="inp" />
        </Campo>
        <Campo label="Atividade (CNAE)">
          <input value={config.atividade} onChange={(e) => onChange('atividade', e.target.value)} className="inp" />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Cidade">
            <input value={config.cidade} onChange={(e) => onChange('cidade', e.target.value)} className="inp" />
          </Campo>
          <Campo label="UF">
            <input value={config.uf} onChange={(e) => onChange('uf', e.target.value.toUpperCase())} maxLength={2} className="inp" />
          </Campo>
        </div>
        <Campo label="Endereço">
          <input value={config.endereco} onChange={(e) => onChange('endereco', e.target.value)} className="inp" />
        </Campo>
      </fieldset>

      {/* Contato manual — destacado */}
      <fieldset className="grid gap-4 rounded-xl border border-brand/40 bg-brand/5 p-4">
        <legend className="px-2 text-xs font-medium text-brand-400">
          Contato (preencha — é o que muda em cada site)
        </legend>
        <Campo label="E-mail de contato">
          <input value={config.email} onChange={(e) => onChange('email', e.target.value)} placeholder="contato@empresa.com.br" className="inp" />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Telefone">
            <input value={config.telefone} onChange={(e) => onChange('telefone', e.target.value)} placeholder="(11) 99999-9999" className="inp" />
          </Campo>
          <Campo label="WhatsApp (DDI+DDD)">
            <input value={config.whatsapp} onChange={(e) => onChange('whatsapp', e.target.value)} placeholder="5511999999999" className="inp" />
          </Campo>
        </div>
        <Campo label="Instagram (opcional)">
          <input value={config.instagram} onChange={(e) => onChange('instagram', e.target.value)} placeholder="@suaempresa" className="inp" />
        </Campo>
      </fieldset>

      {/* Visual + textos */}
      <fieldset className="grid gap-4 rounded-xl border border-ink-600 p-4">
        <legend className="px-2 text-xs font-medium text-slate-400">
          Identidade e textos
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Cor principal">
            <input type="color" value={config.corPrimaria} onChange={(e) => onChange('corPrimaria', e.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-ink-600 bg-ink-700" />
          </Campo>
          <Campo label="URL do logo (opcional)">
            <input value={config.logoUrl} onChange={(e) => onChange('logoUrl', e.target.value)} placeholder="https://..." className="inp" />
          </Campo>
        </div>
        <Campo label="Missão">
          <textarea value={config.missao} onChange={(e) => onChange('missao', e.target.value)} rows={2} className="inp resize-none" />
        </Campo>
        <Campo label="Visão">
          <textarea value={config.visao} onChange={(e) => onChange('visao', e.target.value)} rows={2} className="inp resize-none" />
        </Campo>
        <Campo label="Valores">
          <textarea value={config.valores} onChange={(e) => onChange('valores', e.target.value)} rows={2} className="inp resize-none" />
        </Campo>
      </fieldset>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  )
}
