import { supabase } from './supabase'
import type { MetaVerificacao, Site, SiteConfig } from './types'

const TABELA = 'painel_sites'

// Gera um slug único a partir do nome (base para a URL padrão do site).
export function gerarSlug(nome: string): string {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const sufixo = Math.random().toString(36).slice(2, 6)
  return `${base || 'site'}-${sufixo}`
}

export async function listarSites(): Promise<Site[]> {
  const { data, error } = await supabase
    .from(TABELA)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Site[]
}

export async function obterSite(id: string): Promise<Site | null> {
  const { data, error } = await supabase.from(TABELA).select('*').eq('id', id).single()
  if (error) throw error
  return (data as Site) ?? null
}

export async function criarSite(input: {
  nome: string
  template: string
  config: SiteConfig
}): Promise<Site> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Sessão não encontrada.')

  const { data, error } = await supabase
    .from(TABELA)
    .insert({
      user_id: userId,
      nome: input.nome,
      template: input.template,
      config: input.config,
      slug: gerarSlug(input.nome),
      status: 'rascunho',
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Site
}

export async function atualizarSite(
  id: string,
  patch: Partial<
    Pick<Site, 'nome' | 'template' | 'config' | 'status' | 'custom_domain' | 'meta_verificacao'>
  >,
): Promise<Site> {
  const { data, error } = await supabase
    .from(TABELA)
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Site
}

// Salva a lista de arquivos de verificação da Meta do site.
export async function salvarVerificacaoMeta(
  id: string,
  lista: MetaVerificacao[],
): Promise<Site> {
  return atualizarSite(id, { meta_verificacao: lista })
}

export async function excluirSite(id: string): Promise<void> {
  const { error } = await supabase.from(TABELA).delete().eq('id', id)
  if (error) throw error
}

// Publica (fica acessível pelo Worker) ou volta para rascunho.
// Não rebaixa um site já com domínio ativo.
export async function publicarSite(site: Site): Promise<Site> {
  const novo = site.status === 'rascunho' ? 'publicado' : 'rascunho'
  return atualizarSite(site.id, { status: novo })
}

// URL pública do site via Worker (preview por slug, antes do domínio próprio).
// Configure VITE_WORKER_URL com o domínio do worker (ex.: https://painel-landings.<sub>.workers.dev).
export function urlPublica(site: Site): string | null {
  if (site.custom_domain) return `https://${site.custom_domain}`
  const base = import.meta.env.VITE_WORKER_URL as string | undefined
  if (!base) return null
  return `${base.replace(/\/$/, '')}/s/${site.slug}`
}
