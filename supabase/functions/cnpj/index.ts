// Edge Function: consulta CNPJ na BrasilAPI pelo servidor e devolve os campos
// já mapeados para o SiteConfig. Evita o "Failed to fetch" do navegador
// (rede/extensões/firewall) e centraliza a consulta.

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

function soDigitos(s: string) {
  return String(s || '').replace(/\D/g, '')
}

function formatarCnpj(cnpj: string) {
  const d = soDigitos(cnpj).padStart(14, '0').slice(0, 14)
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ erro: 'Método não permitido' }, 405)

  let corpo: { cnpj?: string }
  try {
    corpo = await req.json()
  } catch {
    return json({ erro: 'JSON inválido.' }, 400)
  }

  const d = soDigitos(corpo.cnpj ?? '')
  if (d.length !== 14) return json({ erro: 'CNPJ deve ter 14 dígitos.' }, 400)

  let resp: Response
  try {
    resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`)
  } catch {
    return json({ erro: 'Não foi possível consultar o CNPJ agora. Tente de novo.' }, 502)
  }
  if (resp.status === 404) return json({ erro: 'CNPJ não encontrado.' }, 404)
  if (!resp.ok) return json({ erro: 'Erro ao consultar o CNPJ.' }, 502)

  const j = await resp.json()
  const cepLimpo = j.cep ? soDigitos(j.cep) : ''
  const cepFmt = cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2')

  // Endereço completo no padrão do exemplo.
  const endereco = [
    [j.logradouro, j.numero].filter(Boolean).join(', '),
    j.bairro,
    [j.municipio, j.uf].filter(Boolean).join('-'),
    cepFmt ? `CEP ${cepFmt}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  // Lista de serviços: CNAE principal + secundários.
  const servicos = [
    j.cnae_fiscal_descricao,
    ...(Array.isArray(j.cnaes_secundarios)
      ? j.cnaes_secundarios.map((x: { descricao?: string }) => x.descricao).filter(Boolean)
      : []),
  ].filter(Boolean)

  const capital =
    j.capital_social != null
      ? Number(j.capital_social).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      : ''

  return json({
    ok: true,
    dados: {
      razaoSocial: j.razao_social ?? '',
      nomeFantasia: j.nome_fantasia || j.razao_social || '',
      cnpj: formatarCnpj(j.cnpj ?? d),
      dataAbertura: j.data_inicio_atividade ?? '',
      situacao: j.descricao_situacao_cadastral ?? '',
      cidade: j.municipio ?? '',
      uf: j.uf ?? '',
      atividade: j.cnae_fiscal_descricao ?? '',
      servicos,
      endereco,
      logradouro: [j.logradouro, j.numero].filter(Boolean).join(', '),
      cep: cepLimpo,
      porte: j.porte ?? '',
      naturezaJuridica: j.natureza_juridica ?? '',
      capitalSocial: capital,
      tipo: j.descricao_identificador_matriz_filial ?? '',
      telefone: j.ddd_telefone_1 ? soDigitos(j.ddd_telefone_1) : '',
    },
  })
})
