import { supabase } from './supabase'

// Chama a Edge Function `dominios` com o JWT da sessão atual.
async function chamar(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('dominios', { body: payload })
  if (error) {
    // A Edge Function devolve { erro } em falhas de negócio (vem em error.context).
    let msg = (error as { message?: string }).message ?? 'Erro na função de domínios.'
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json()
        if (body?.erro) {
          msg = body.erro
          if (body.detalhes) msg += ' — ' + JSON.stringify(body.detalhes)
        }
      } catch {
        /* mantém msg padrão */
      }
    }
    throw new Error(msg)
  }
  if (data?.erro) throw new Error(data.erro)
  return data
}

export interface RespostaAdicionar {
  ok: boolean
  dominio: string
  zona?: string
  instrucao: string
}

export interface RespostaStatus {
  ok: boolean
  ativo: boolean
  vinculado?: boolean
  instrucao?: string
}

export interface Zona {
  name: string
  status: string
}
export interface DominioUsado {
  id: string
  nome: string
  custom_domain: string
  status: string
}
export interface RespostaZonas {
  ok: boolean
  zonas: Zona[]
  usados: DominioUsado[]
}

export async function listarZonas(): Promise<RespostaZonas> {
  const d = await chamar({ acao: 'zonas' })
  return { ok: true, zonas: d.zonas ?? [], usados: d.usados ?? [] }
}

export function adicionarDominio(siteId: string, dominio: string): Promise<RespostaAdicionar> {
  return chamar({ acao: 'adicionar', site_id: siteId, dominio })
}

export function statusDominio(siteId: string): Promise<RespostaStatus> {
  return chamar({ acao: 'status', site_id: siteId })
}

export function removerDominio(siteId: string): Promise<{ ok: boolean }> {
  return chamar({ acao: 'remover', site_id: siteId })
}
