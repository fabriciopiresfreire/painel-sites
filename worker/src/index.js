// Cloudflare Worker — serve as landing pages do painel.
//
// Modos de acesso:
//   1. Domínio próprio  -> usa o header Host (ex.: cliente.com.br)
//   2. Preview por slug  -> caminho /s/<slug> no domínio do worker
//
// Segredos (wrangler secret put):
//   SUPABASE_URL        ex.: https://SEU-PROJETO.supabase.co
//   SUPABASE_ANON_KEY   chave anon/public (RLS protege; a RPC é security definer)

import { renderTemplate } from './template.js'

const CACHE_SEGUNDOS = 60

// Arquivos de verificação de domínio da Meta (método "arquivo HTML").
// A Meta busca https://<dominio>/<token>.html e compara o corpo com o token.
// Servir aqui cobre TODOS os sites (atuais e futuros) em qualquer host.
// Para novos tokens, basta adicionar outra entrada: '<token>.html': '<token>'.
// Tokens fixos de verificacao da Meta (arquivo HTML).
// Adicione os seus: '<token>.html': '<token>'
const META_VERIFICACAO = {
  // 'seutoken123.html': 'seutoken123',
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Verificação de domínio da Meta (arquivo na raiz do domínio).
    const arquivoVerif = url.pathname.replace(/^\//, '')
    const headersVerif = {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    }
    // 1) Mapa fixo global (tokens legados, valem para qualquer host).
    if (Object.prototype.hasOwnProperty.call(META_VERIFICACAO, arquivoVerif)) {
      return new Response(META_VERIFICACAO[arquivoVerif], { status: 200, headers: headersVerif })
    }
    // 2) Por site: arquivo .html na raiz, enviado pelo usuário no painel.
    //    Resolve pelo host (custom_domain), independente do status do site.
    if (/^[^/]+\.html$/i.test(arquivoVerif)) {
      try {
        const conteudo = await verificacaoMeta(env, url.hostname, arquivoVerif)
        if (conteudo != null) {
          return new Response(conteudo, { status: 200, headers: headersVerif })
        }
      } catch {
        // Se a consulta falhar, segue o fluxo normal (tenta renderizar o site).
      }
    }

    // Favicon / assets não resolvem site.
    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 204 })
    }

    // Identificador: slug (/s/<slug>) tem prioridade; senão, o hostname.
    let identificador
    const matchSlug = url.pathname.match(/^\/s\/([a-z0-9-]+)\/?$/i)
    if (matchSlug) {
      identificador = matchSlug[1]
    } else {
      identificador = url.hostname
    }

    if (!identificador) {
      return paginaErro(400, 'Requisição inválida.')
    }

    let site
    try {
      site = await resolverSite(env, identificador)
    } catch (e) {
      return paginaErro(502, 'Erro ao carregar o site.')
    }

    if (!site) {
      return paginaErro(404, 'Site não encontrado ou não publicado.')
    }

    const html = renderTemplate(site.template, site.config)
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': `public, max-age=${CACHE_SEGUNDOS}`,
      },
    })
  },
}

// Busca o conteúdo de um arquivo de verificação da Meta pelo host + nome do
// arquivo (função SECURITY DEFINER; devolve só o token ou null).
async function verificacaoMeta(env, host, arquivo) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/painel_verificacao_meta`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ p_host: host, p_arquivo: arquivo }),
  })
  if (!resp.ok) return null
  const data = await resp.json()
  return typeof data === 'string' && data.length ? data : null
}

async function resolverSite(env, identificador) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/painel_resolver_site`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ p_identificador: identificador }),
  })
  if (!resp.ok) throw new Error(`supabase ${resp.status}`)
  const linhas = await resp.json()
  return Array.isArray(linhas) && linhas.length ? linhas[0] : null
}

function paginaErro(status, mensagem) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${status}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b12;
color:#94a3b8;font-family:system-ui,sans-serif;text-align:center}h1{color:#fff;font-size:48px;margin:0}
p{margin-top:8px}</style></head><body><div><h1>${status}</h1><p>${mensagem}</p></div></body></html>`
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
