// Modelo de dados do painel. Espelha a tabela `sites` no Supabase.
// O site é institucional (verificação de empresa no Meta/BM): os dados da
// empresa vêm do CNPJ; e-mail e telefone são manuais.

export type SiteStatus = 'rascunho' | 'publicado' | 'dominio_pendente' | 'ativo'

// Arquivo de verificação de domínio da Meta (método "arquivo HTML").
export interface MetaVerificacao {
  arquivo: string // ex.: seutoken123.html
  conteudo: string // token que vai no corpo do arquivo
}

export interface SiteConfig {
  // Dados da empresa (preenchidos pelo CNPJ)
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  dataAbertura: string // ISO yyyy-mm-dd
  situacao: string // ex.: ATIVA
  cidade: string
  uf: string
  atividade: string // CNAE principal (descrição)
  servicos: string[] // CNAE principal + secundários (lista de serviços)
  endereco: string // "LOGRADOURO, NUMERO, BAIRRO, CIDADE-UF, CEP 00000000"
  logradouro: string
  cep: string
  porte: string // ex.: MICRO EMPRESA
  naturezaJuridica: string
  capitalSocial: string // já formatado, ex.: R$ 50.000,00
  tipo: string // Matriz / Filial

  // Contato (manual)
  email: string
  telefone: string
  whatsapp: string
  instagram: string

  // Visual
  logoUrl: string
  corPrimaria: string

  // Textos institucionais (pré-preenchidos, editáveis)
  missao: string
  visao: string
  valores: string
}

export interface Site {
  id: string
  user_id: string
  nome: string
  template: string
  config: SiteConfig
  slug: string
  custom_domain: string | null
  status: SiteStatus
  meta_verificacao: MetaVerificacao[]
  created_at: string
}

export const configVazio: SiteConfig = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  dataAbertura: '',
  situacao: '',
  cidade: '',
  uf: '',
  atividade: '',
  servicos: [],
  endereco: '',
  logradouro: '',
  cep: '',
  porte: '',
  naturezaJuridica: '',
  capitalSocial: '',
  tipo: '',
  email: '',
  telefone: '',
  whatsapp: '',
  instagram: '',
  logoUrl: '',
  corPrimaria: '#2563eb',
  missao:
    'Oferecer soluções de alta qualidade, com ética, inovação e foco total na satisfação dos nossos clientes.',
  visao:
    'Ser referência no nosso segmento, reconhecida pela excelência, transparência e compromisso com resultados.',
  valores: 'Ética, transparência, inovação, respeito ao cliente e responsabilidade.',
}
