import { supabase } from './supabase'
import type { SiteConfig } from './types'

export function soDigitos(s: string): string {
  return (s || '').replace(/\D/g, '')
}

export function formatarCnpj(cnpj: string): string {
  const d = soDigitos(cnpj).padStart(14, '0').slice(0, 14)
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Consulta o CNPJ pela Edge Function (que fala com a BrasilAPI no servidor),
// evitando falhas de rede do navegador. Não sobrescreve e-mail (vem manual).
export async function buscarCnpj(cnpj: string): Promise<Partial<SiteConfig>> {
  const d = soDigitos(cnpj)
  if (d.length !== 14) throw new Error('CNPJ deve ter 14 dígitos.')

  const { data, error } = await supabase.functions.invoke('cnpj', { body: { cnpj: d } })
  if (error) {
    let msg = (error as { message?: string }).message ?? 'Erro ao consultar o CNPJ.'
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const b = await ctx.json()
        if (b?.erro) msg = b.erro
      } catch {
        /* mantém msg padrão */
      }
    }
    throw new Error(msg)
  }
  if (data?.erro) throw new Error(data.erro)
  return (data?.dados ?? {}) as Partial<SiteConfig>
}
