// Edge Function: busca, checa e REGISTRA (compra) domínios via Cloudflare Registrar API (beta).
// O token da Cloudflare fica no servidor. Compra tem travas: nunca automática,
// recusa premium, respeita teto de preço e exige confirmação explícita do valor.
//
// Ações (POST JSON):
//   { acao: 'buscar',  q }                         -> sugestões (dados em cache, não autoritativo)
//   { acao: 'checar',  dominios: string[] }        -> disponibilidade real + preço (até 20)
//   { acao: 'comprar', dominio, preco_ok, contato, anos?, extras? }
//        -> registra; só prossegue se registrable, não-premium, dentro do teto,
//           e preco_ok === registration_cost retornado na hora.
//
// Secrets: CF_API_TOKEN (precisa de Account > Registrar: Edit), CF_ACCOUNT_ID.
// Pré-requisito da conta: perfil de cobrança com método de pagamento (feito no dashboard).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CF_API = 'https://api.cloudflare.com/client/v4'
// Teto de segurança (USD) — compra acima disso é recusada mesmo com confirmação.
const TETO_USD = 100

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ erro: 'Método não permitido' }, 405)

  const CF_API_TOKEN = Deno.env.get('CF_API_TOKEN')
  const CF_ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    return json({ erro: 'Cloudflare não configurado (CF_API_TOKEN / CF_ACCOUNT_ID).' }, 500)
  }

  // Exige usuário autenticado.
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.replace(/^[Bb]earer\s+/, '')
  const supabaseUser = createClient(SUPABASE_URL, ANON_KEY)
  const { data: userData } = await supabaseUser.auth.getUser(jwt)
  if (!userData.user) return json({ erro: 'Não autenticado.' }, 401)

  let corpo: {
    acao?: string
    q?: string
    dominios?: string[]
    dominio?: string
    preco_ok?: string
    anos?: number
    contato?: Record<string, unknown>
    extras?: Record<string, unknown>
  }
  try {
    corpo = await req.json()
  } catch {
    return json({ erro: 'JSON inválido.' }, 400)
  }

  const cfHeaders = {
    authorization: `Bearer ${CF_API_TOKEN}`,
    'content-type': 'application/json',
  }

  // ---- BUSCAR (sugestões) ----
  if (corpo.acao === 'buscar') {
    const q = (corpo.q ?? '').trim()
    if (!q) return json({ erro: 'Informe um termo de busca.' }, 400)
    const url = `${CF_API}/accounts/${CF_ACCOUNT_ID}/registrar/domain-search?q=${encodeURIComponent(q)}&limit=20`
    const resp = await fetch(url, { headers: cfHeaders })
    const cf = await resp.json()
    if (!cf.success) return json({ erro: 'Busca falhou.', detalhes: cf.errors }, 400)
    return json({ ok: true, dominios: cf.result?.domains ?? [] })
  }

  // ---- CHECAR (autoritativo + preço) ----
  if (corpo.acao === 'checar') {
    const lista = (corpo.dominios ?? []).slice(0, 20)
    if (!lista.length) return json({ erro: 'Informe ao menos um domínio.' }, 400)
    const resp = await fetch(`${CF_API}/accounts/${CF_ACCOUNT_ID}/registrar/domain-check`, {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify({ domains: lista }),
    })
    const cf = await resp.json()
    if (!cf.success) return json({ erro: 'Checagem falhou.', detalhes: cf.errors }, 400)
    return json({ ok: true, dominios: cf.result?.domains ?? [] })
  }

  // ---- COMPRAR (registrar) ----
  if (corpo.acao === 'comprar') {
    const dominio = (corpo.dominio ?? '').trim().toLowerCase()
    if (!dominio || !dominio.includes('.')) return json({ erro: 'Domínio inválido.' }, 400)

    // 1) Re-checa AGORA (autoritativo) para pegar preço/tier atuais.
    const check = await fetch(`${CF_API}/accounts/${CF_ACCOUNT_ID}/registrar/domain-check`, {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify({ domains: [dominio] }),
    })
    const checkJson = await check.json()
    const info = checkJson.result?.domains?.[0]
    if (!checkJson.success || !info) {
      return json({ erro: 'Não foi possível checar o domínio.', detalhes: checkJson.errors }, 400)
    }
    if (!info.registrable) {
      return json({ erro: `Domínio indisponível (${info.reason ?? 'motivo desconhecido'}).` }, 400)
    }
    if (info.tier === 'premium') {
      return json({ erro: 'Domínio premium não é suportado para compra via API.' }, 400)
    }

    const custo = info.pricing?.registration_cost
    const moeda = info.pricing?.currency ?? 'USD'
    const custoNum = Number(custo)
    if (!custo || Number.isNaN(custoNum)) {
      return json({ erro: 'Preço indisponível para este domínio.' }, 400)
    }
    // 2) Teto de segurança.
    if (custoNum > TETO_USD) {
      return json({ erro: `Preço ${moeda} ${custo} acima do teto de segurança (${TETO_USD}).` }, 400)
    }
    // 3) O valor confirmado pelo usuário tem que bater com o preço de agora.
    if (corpo.preco_ok !== custo) {
      return json(
        {
          erro: 'Preço mudou desde a confirmação. Confira o novo valor e confirme de novo.',
          preco_atual: custo,
          moeda,
        },
        409,
      )
    }

    // 4) Monta o corpo do registro no formato da Cloudflare Registrar API.
    const anos = Math.min(Math.max(Number(corpo.anos ?? 1), 1), 10)
    const c = (corpo.contato ?? {}) as Record<string, string>
    const nomeCompleto = [c.first_name, c.last_name].filter(Boolean).join(' ').trim()
    const foneDigitos = String(c.phone ?? '').replace(/\D/g, '')
    const comDdi = foneDigitos.startsWith('55') ? foneDigitos : '55' + foneDigitos
    const telE164 = foneDigitos ? `+${comDdi.slice(0, 2)}.${comDdi.slice(2)}` : ''
    const body: Record<string, unknown> = {
      domain_name: dominio,
      years: anos,
      auto_renew: true,
      privacy_mode: 'redaction',
      contacts: {
        registrant: {
          email: c.email ?? '',
          phone: telE164,
          postal_info: {
            name: nomeCompleto,
            ...(c.organization ? { organization: c.organization } : {}),
            address: {
              street: c.address ?? '',
              city: c.city ?? '',
              state: (c.state ?? '').toUpperCase(),
              postal_code: String(c.zip ?? '').replace(/\D/g, ''),
              country_code: (c.country || 'BR').toUpperCase().slice(0, 2),
            },
          },
        },
      },
      ...(corpo.extras ?? {}),
    }

    const reg = await fetch(`${CF_API}/accounts/${CF_ACCOUNT_ID}/registrar/registrations`, {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify(body),
    })
    const regJson = await reg.json()
    if (!regJson.success) {
      return json(
        { erro: 'Registro recusado pela Cloudflare.', detalhes: regJson.errors, status_http: reg.status },
        400,
      )
    }

    return json({
      ok: true,
      dominio,
      custo,
      moeda,
      estado: regJson.result?.state ?? (reg.status === 202 ? 'processando' : 'registrado'),
      resultado: regJson.result ?? null,
    })
  }

  return json({ erro: 'Ação desconhecida.' }, 400)
})
