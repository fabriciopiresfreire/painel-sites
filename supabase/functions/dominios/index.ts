// Edge Function: vincula domínios próprios (zonas da conta Cloudflare) ao Worker
// `painel-landings` usando Workers Custom Domains. A Cloudflare cria o DNS e
// emite o SSL automaticamente, porque o domínio é uma zona da própria conta.
//
// Ações (POST JSON):
//   { acao: 'adicionar', site_id, dominio }  -> acha a zona, anexa ao Worker, grava
//   { acao: 'status',    site_id }           -> confirma anexo + testa HTTPS, ativa
//   { acao: 'remover',   site_id }           -> desanexa o domínio e limpa o site
//
// Secrets (Supabase Dashboard > Edge Functions > Secrets):
//   CF_API_TOKEN   token: Account Workers Scripts:Edit + Zone DNS:Edit + Zone:Read
//   CF_ACCOUNT_ID  id da conta Cloudflare
// Injetados pelo Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CF_API = 'https://api.cloudflare.com/client/v4'
const WORKER_SERVICE = 'painel-landings'
const WORKER_ENV = 'production'

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

function normalizarDominio(d: string): string {
  return String(d || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ erro: 'Método não permitido' }, 405)

  const CF_API_TOKEN = Deno.env.get('CF_API_TOKEN')
  const CF_ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    return json({ erro: 'Cloudflare não configurado (CF_API_TOKEN / CF_ACCOUNT_ID).' }, 500)
  }

  // Autentica o usuário pelo JWT (passado explicitamente — em Edge Function
  // o getUser() sem argumento não lê o header).
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.replace(/^[Bb]earer\s+/, '')
  const supabaseUser = createClient(SUPABASE_URL, ANON_KEY)
  const { data: userData } = await supabaseUser.auth.getUser(jwt)
  const user = userData.user
  if (!user) return json({ erro: 'Não autenticado.' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  let corpo: { acao?: string; site_id?: string; dominio?: string }
  try {
    corpo = await req.json()
  } catch {
    return json({ erro: 'JSON inválido.' }, 400)
  }

  const { acao, site_id } = corpo

  const cfHeaders = {
    authorization: `Bearer ${CF_API_TOKEN}`,
    'content-type': 'application/json',
  }

  // ---- ZONAS ---- (não exige site_id): lista os domínios da conta Cloudflare
  // e quais já estão vinculados a sites do usuário.
  if (acao === 'zonas') {
    const resp = await fetch(`${CF_API}/zones?per_page=50&account.id=${CF_ACCOUNT_ID}`, {
      headers: cfHeaders,
    })
    const cf = await resp.json()
    if (!cf.success) return json({ erro: 'Falha ao listar domínios.', detalhes: cf.errors }, 400)
    const zonas = (cf.result as Array<{ name: string; status: string }>).map((z) => ({
      name: z.name,
      status: z.status,
    }))
    const { data: usados } = await admin
      .from('painel_sites')
      .select('id, nome, custom_domain, status')
      .eq('user_id', user.id)
      .not('custom_domain', 'is', null)
    return json({ ok: true, zonas, usados: usados ?? [] })
  }

  if (!acao || !site_id) return json({ erro: 'acao e site_id são obrigatórios.' }, 400)

  // Confirma a posse do site.
  const { data: site, error: erroSite } = await admin
    .from('painel_sites')
    .select('id, user_id, custom_domain, status')
    .eq('id', site_id)
    .single()
  if (erroSite || !site) return json({ erro: 'Site não encontrado.' }, 404)
  if (site.user_id !== user.id) return json({ erro: 'Sem permissão.' }, 403)

  // Acha a zona (da conta) à qual o hostname pertence.
  async function acharZona(hostname: string) {
    const resp = await fetch(`${CF_API}/zones?per_page=50&account.id=${CF_ACCOUNT_ID}`, {
      headers: cfHeaders,
    })
    const cf = await resp.json()
    if (!cf.success) return null
    // Zona onde hostname == nome OU hostname termina em ".nome".
    const zonas = (cf.result as Array<{ id: string; name: string }>) ?? []
    let melhor: { id: string; name: string } | null = null
    for (const z of zonas) {
      if (hostname === z.name || hostname.endsWith('.' + z.name)) {
        if (!melhor || z.name.length > melhor.name.length) melhor = z
      }
    }
    return melhor
  }

  // Busca o registro de custom domain do Worker por hostname.
  async function acharWorkerDomain(hostname: string) {
    const resp = await fetch(
      `${CF_API}/accounts/${CF_ACCOUNT_ID}/workers/domains?hostname=${encodeURIComponent(hostname)}`,
      { headers: cfHeaders },
    )
    const cf = await resp.json()
    return cf.success && Array.isArray(cf.result) && cf.result.length ? cf.result[0] : null
  }

  // ---- ADICIONAR ----
  if (acao === 'adicionar') {
    const dominio = normalizarDominio(corpo.dominio ?? '')
    if (!dominio || !dominio.includes('.')) return json({ erro: 'Domínio inválido.' }, 400)

    const zona = await acharZona(dominio)
    if (!zona) {
      return json(
        {
          erro:
            'Esse domínio não está na sua conta Cloudflare. Compre/adicione o domínio na Cloudflare primeiro e tente de novo.',
        },
        400,
      )
    }

    const resp = await fetch(`${CF_API}/accounts/${CF_ACCOUNT_ID}/workers/domains`, {
      method: 'PUT',
      headers: cfHeaders,
      body: JSON.stringify({
        zone_id: zona.id,
        hostname: dominio,
        service: WORKER_SERVICE,
        environment: WORKER_ENV,
      }),
    })
    const cf = await resp.json()
    if (!cf.success) {
      return json({ erro: 'Cloudflare recusou o vínculo.', detalhes: cf.errors }, 400)
    }

    await admin
      .from('painel_sites')
      .update({ custom_domain: dominio, status: 'dominio_pendente' })
      .eq('id', site_id)

    return json({
      ok: true,
      dominio,
      zona: zona.name,
      // Não há CNAME para configurar: a Cloudflare cria o DNS e o SSL sozinha.
      instrucao: 'Domínio vinculado. A Cloudflare está emitindo o SSL (costuma levar 1-2 min).',
    })
  }

  // ---- STATUS ----
  if (acao === 'status') {
    if (!site.custom_domain) return json({ erro: 'Site sem domínio.' }, 400)

    const wd = await acharWorkerDomain(site.custom_domain)
    if (!wd) return json({ erro: 'Vínculo não encontrado na Cloudflare.' }, 404)

    // Testa se o HTTPS já responde pelo Worker.
    let httpsOk = false
    try {
      const teste = await fetch(`https://${site.custom_domain}/`, {
        method: 'GET',
        redirect: 'manual',
      })
      httpsOk = teste.status > 0 && teste.status < 500
    } catch {
      httpsOk = false
    }

    if (httpsOk && site.status !== 'ativo') {
      await admin.from('painel_sites').update({ status: 'ativo' }).eq('id', site_id)
    }

    return json({
      ok: true,
      ativo: httpsOk,
      vinculado: true,
      instrucao: httpsOk
        ? 'Domínio ativo com SSL.'
        : 'Vínculo ok, SSL ainda provisionando. Aguarde 1-2 min e verifique de novo.',
    })
  }

  // ---- REMOVER ----
  if (acao === 'remover') {
    if (site.custom_domain) {
      const wd = await acharWorkerDomain(site.custom_domain)
      if (wd?.id) {
        await fetch(`${CF_API}/accounts/${CF_ACCOUNT_ID}/workers/domains/${wd.id}`, {
          method: 'DELETE',
          headers: cfHeaders,
        })
      }
    }
    await admin
      .from('painel_sites')
      .update({ custom_domain: null, status: 'publicado' })
      .eq('id', site_id)
    return json({ ok: true })
  }

  return json({ erro: 'Ação desconhecida.' }, 400)
})
