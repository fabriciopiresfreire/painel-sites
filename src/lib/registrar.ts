import { supabase } from './supabase'

async function chamar(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('registrar', { body: payload })
  if (error) {
    // Quando a função responde non-2xx, o corpo real vem em error.context.
    let msg = (error as { message?: string }).message ?? 'Erro no registrar.'
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
  if (data?.erro) {
    const e = new Error(data.erro) as Error & { extra?: unknown }
    e.extra = data
    throw e
  }
  return data
}

export interface DominioResultado {
  name: string
  registrable: boolean
  tier?: 'standard' | 'premium'
  reason?: string
  pricing?: { currency: string; registration_cost: string; renewal_cost: string }
}

export interface Contato {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  organization?: string
}

export async function buscarDominios(q: string): Promise<DominioResultado[]> {
  const d = await chamar({ acao: 'buscar', q })
  return d.dominios ?? []
}

export async function checarDominios(dominios: string[]): Promise<DominioResultado[]> {
  const d = await chamar({ acao: 'checar', dominios })
  return d.dominios ?? []
}

export interface RespostaCompra {
  ok: boolean
  dominio: string
  custo: string
  moeda: string
  estado: string
}

export async function comprarDominio(args: {
  dominio: string
  preco_ok: string
  contato: Contato
  anos?: number
}): Promise<RespostaCompra> {
  return chamar({ acao: 'comprar', ...args })
}
