// Renderizador do site institucional em JS puro, para o Worker.
// Mantém paridade com src/lib/templates.tsx -> renderTemplate().
// Ao editar o template, atualize os DOIS arquivos.

const TEMPLATES = [
  { id: 'corporativo', cor: '#2563eb' },
  { id: 'esmeralda', cor: '#059669' },
  { id: 'grafite', cor: '#0f172a' },
]

function templatePorId(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function dataBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

function telDisplay(t) {
  const d = (t || '').replace(/\D/g, '')
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  return t || ''
}

function waLink(numero) {
  const d = (numero || '').replace(/\D/g, '')
  if (!d) return ''
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}`
}

export function renderTemplate(template, cfg) {
  cfg = cfg || {}
  const def = templatePorId(template)
  const cor = /^#[0-9a-fA-F]{6}$/.test(cfg.corPrimaria) ? cfg.corPrimaria : def.cor
  const headerDark = template === 'grafite'

  const razao = esc(cfg.razaoSocial || 'Razão Social da Empresa LTDA')
  const fantasia = esc(cfg.nomeFantasia || cfg.razaoSocial || 'Nome Fantasia')
  const cnpj = esc(cfg.cnpj || '00.000.000/0001-00')
  const cidadeUf = esc([cfg.cidade, cfg.uf].filter(Boolean).join('-'))
  const atividade = esc(cfg.atividade || 'suas atividades')
  const atividadeLower = atividade.charAt(0).toLowerCase() + atividade.slice(1)
  const endereco = esc(cfg.endereco)
  const logradouro = esc(cfg.logradouro)
  const abertura = dataBr(cfg.dataAbertura)
  const email = esc(cfg.email || 'contato@empresa.com.br')
  const telefone = esc(telDisplay(cfg.telefone))
  const wa = waLink(cfg.whatsapp || cfg.telefone)
  const instagram = cfg.instagram ? esc(String(cfg.instagram).replace(/^@/, '')) : ''
  const ano = new Date().getFullYear()
  const servicos = Array.isArray(cfg.servicos) ? cfg.servicos.filter(Boolean) : []

  const logo = cfg.logoUrl
    ? `<img src="${esc(cfg.logoUrl)}" alt="${fantasia}" class="logo" />`
    : `<div class="logo logo-txt">${esc((cfg.nomeFantasia || razao).slice(0, 2).toUpperCase())}</div>`

  const servicosTexto = servicos.map(esc).join(', ')
  const p1 = `A ${razao}, inscrita sob o CNPJ ${cnpj}${abertura ? `, foi fundada em ${abertura}` : ''}${cidadeUf ? `, na cidade de ${cidadeUf}` : ''}. Desde a sua criação, a empresa tem se dedicado a oferecer soluções de excelência em ${atividadeLower}, sempre buscando a inovação e a satisfação de seus clientes.`
  const p2 = servicos.length
    ? `Nossas principais atividades incluem ${servicosTexto}. Com esse portfólio, atendemos às necessidades de nossos clientes com qualidade e compromisso, ajudando-os a se destacar em um mercado cada vez mais competitivo.`
    : ''
  const p3 = `${logradouro ? `Localizada em ${cidadeUf}, na ${logradouro}, a` : `A`} ${fantasia} é guiada por valores como a transparência, a responsabilidade e o compromisso com a qualidade, oferecendo confiança e suporte contínuo aos seus clientes.`
  const p4 = `Estamos à disposição para atender e capacitar nossos clientes a alcançarem seus objetivos. Entre em contato e descubra como podemos contribuir com o seu negócio.`

  const servicosLista = servicos.length
    ? `<ul class="servicos">${servicos.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : ''

  const info = [
    ['Razão Social', razao],
    ['Nome Fantasia', fantasia],
    ['CNPJ', cnpj],
    ['Data de Abertura', abertura],
    ['Porte', esc(cfg.porte)],
    ['Natureza Jurídica', esc(cfg.naturezaJuridica)],
    ['Situação Cadastral', esc(cfg.situacao)],
    ['Tipo', esc(cfg.tipo)],
    ['Capital Social', esc(cfg.capitalSocial)],
  ]
    .filter((row) => row[1])
    .map((row) => `<div class="info-row"><span>${row[0]}</span><strong>${row[1]}</strong></div>`)
    .join('')

  const contatoItens = [
    endereco && `<li><strong>Endereço:</strong> ${endereco}</li>`,
    email && `<li><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></li>`,
    telefone &&
      `<li><strong>Telefone:</strong> ${wa ? `<a href="${wa}" target="_blank" rel="noopener">${telefone}</a>` : telefone}</li>`,
    instagram &&
      `<li><strong>Instagram:</strong> <a href="https://instagram.com/${instagram}" target="_blank" rel="noopener">@${instagram}</a></li>`,
  ]
    .filter(Boolean)
    .join('')

  const priv = `A ${razao}, inscrita sob o CNPJ ${cnpj}${endereco ? `, com endereço em ${endereco}` : ''}, valoriza a privacidade e a proteção dos dados pessoais de seus clientes, usuários e visitantes, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

1. Finalidade
Esta política descreve como coletamos, utilizamos, armazenamos e protegemos os dados pessoais dos clientes, usuários e visitantes que interagem conosco por meio de nossos serviços digitais, portais, e-mail, telefone, redes sociais ou durante a prestação de serviços contratados.

2. Dados Coletados
Informações fornecidas voluntariamente: nome, e-mail, telefone, endereço (para faturamento ou contato), dados da empresa e informações necessárias para a execução dos serviços contratados.
Dados técnicos e de navegação: endereço IP, tipo de dispositivo, páginas acessadas, tempo de visita e interações, quando aplicável.
Dados de interação: registros de atendimento e comunicações por e-mail, telefone ou outros canais de suporte.

3. Uso dos Dados
Prestação, gerenciamento e melhoria dos serviços contratados; comunicação relacionada a serviços, suporte técnico, atualizações e faturamento; personalização da experiência do usuário; e cumprimento de obrigações legais e regulatórias.

4. Compartilhamento de Dados
Não comercializamos nem compartilhamos dados pessoais com terceiros para fins publicitários não autorizados. Podemos compartilhar dados com parceiros técnicos e de infraestrutura, exclusivamente para a execução dos serviços contratados, e com autoridades legais, mediante requisição formal e nos termos da lei.

5. Direitos do Titular (LGPD)
Você tem direito a acessar, corrigir ou atualizar seus dados; solicitar a exclusão dos dados, exceto quando a retenção for necessária por obrigação legal ou contratual; revogar o consentimento, quando aplicável; e solicitar a portabilidade dos dados.

6. Segurança e Armazenamento
Implementamos medidas técnicas e administrativas para proteger os dados contra acesso não autorizado, alteração ou destruição. Os dados são armazenados pelo tempo necessário para cumprir as finalidades descritas ou exigências legais.

7. Alterações nesta Política
Esta política pode ser atualizada periodicamente. Alterações serão comunicadas por nossos canais oficiais ou notificadas aos clientes quando relevantes.

8. Contato para Privacidade
E-mail: ${email}${telefone ? `\nTelefone: ${telefone}` : ''}${endereco ? `\nEndereço postal: ${endereco}` : ''}`

  const termos = `O uso deste site implica a aceitação integral dos termos aqui descritos. Todo o conteúdo publicado — textos, marcas, logotipos e imagens — pertence à ${razao} e não pode ser reproduzido sem autorização prévia.
As informações apresentadas têm caráter institucional e informativo. A empresa se reserva o direito de alterar o conteúdo deste site a qualquer momento, sem aviso prévio. Dúvidas sobre estes Termos de Uso podem ser encaminhadas para o e-mail ${email}.`

  const rodapeInfo = [
    ['CNPJ', cnpj],
    ['Razão Social', razao],
    ['Nome Fantasia', fantasia],
    ['Data de Abertura', abertura],
    ['Porte', esc(cfg.porte)],
    ['Natureza Jurídica', esc(cfg.naturezaJuridica)],
    ['Situação Cadastral', esc(cfg.situacao)],
    ['Tipo', esc(cfg.tipo)],
    ['Capital Social', esc(cfg.capitalSocial)],
    ['Endereço', endereco],
    ['E-mail', email],
    ['Telefone', telefone],
  ]
    .filter((row) => row[1])
    .map((row) => `<div><span>${row[0]}:</span> ${row[1]}</div>`)
    .join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="facebook-domain-verification" content="SEU_TOKEN_AQUI" />
<title>${razao}</title>
<meta name="description" content="Site institucional de ${fantasia}. ${atividade}. CNPJ ${cnpj}." />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${fantasia}" />
<meta property="og:title" content="${razao}" />
<meta property="og:description" content="Site institucional de ${fantasia}. ${atividade}." />
<meta property="og:locale" content="pt_BR" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  :root { --cor: ${cor}; --tinta: #1f2937; --suave: #6b7280; --borda: #e5e7eb; --fundo: #f7f9fc; --card: #fff; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Poppins", system-ui, sans-serif; color: var(--tinta); background: var(--fundo); line-height: 1.75; }
  a { color: var(--cor); }
  .wrap { max-width: 860px; margin: 0 auto; padding: 0 20px; }
  header { background: ${headerDark ? '#0f172a' : 'var(--cor)'}; color: #fff; padding: 14px 0; position: sticky; top: 0; z-index: 10; }
  header .wrap { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  header nav a { color: #fff; opacity: .9; text-decoration: none; margin-left: 16px; font-size: 14px; font-weight: 500; }
  header nav a:hover { opacity: 1; }
  .brand { font-weight: 700; letter-spacing: .02em; }
  .hero { text-align: center; padding: 48px 0 28px; }
  .logo { width: 116px; height: 116px; border-radius: 50%; object-fit: cover; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.12); margin: 0 auto 20px; display: block; }
  .logo-txt { display: grid; place-items: center; font-weight: 800; font-size: 36px; color: var(--cor); border: 3px solid var(--cor); }
  .hero h1 { font-size: clamp(1.4rem, 5vw, 2.1rem); font-weight: 800; letter-spacing: -.01em; }
  .hero .cnpj { color: var(--suave); margin-top: 6px; font-weight: 500; }
  .badge { display: inline-block; margin-top: 12px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; }
  .meta { color: var(--suave); font-size: 14px; margin-top: 10px; }
  section.card { background: var(--card); border: 1px solid var(--borda); border-radius: 16px; box-shadow: 0 10px 30px rgba(15,23,42,.05); padding: clamp(22px, 5vw, 42px); margin: 16px 0; }
  section.card h2 { color: var(--cor); font-size: clamp(1.1rem, 4vw, 1.45rem); font-weight: 800; margin-bottom: 16px; text-align: center; }
  section.card p { margin-bottom: 14px; color: #374151; }
  .servicos { list-style: none; display: grid; gap: 10px; margin-top: 4px; }
  @media (min-width: 640px) { .servicos { grid-template-columns: 1fr 1fr; } }
  .servicos li { background: var(--fundo); border: 1px solid var(--borda); border-radius: 10px; padding: 12px 16px; font-size: .95rem; }
  .servicos li::before { content: "✔ "; color: var(--cor); font-weight: 800; }
  .mvv { display: grid; gap: 16px; }
  @media (min-width: 640px) { .mvv { grid-template-columns: repeat(3, 1fr); } }
  .mvv .item { background: var(--fundo); border: 1px solid var(--borda); border-radius: 12px; padding: 20px; text-align: center; }
  .mvv .item h3 { color: var(--cor); font-size: 1rem; margin-bottom: 8px; font-weight: 700; }
  .mvv .item p { font-size: .92rem; margin: 0; }
  .info-grid { display: grid; gap: 0; }
  .info-row { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--borda); font-size: .95rem; }
  .info-row:last-child { border-bottom: 0; }
  .info-row span { color: var(--suave); }
  .info-row strong { text-align: right; }
  ul.contato { list-style: none; display: grid; gap: 10px; }
  ul.contato li { background: var(--fundo); border: 1px solid var(--borda); border-radius: 10px; padding: 12px 16px; font-size: .95rem; }
  ul.contato a { text-decoration: none; }
  .legal { font-size: .88rem; color: #374151; white-space: pre-line; }
  .cta { text-align: center; margin: 22px 0 4px; }
  .cta a { display: inline-block; background: var(--cor); color: #fff; text-decoration: none; padding: 14px 34px; border-radius: 999px; font-weight: 600; box-shadow: 0 8px 24px rgba(37,99,235,.3); }
  .tagline { text-align: center; font-style: italic; color: var(--suave); margin-top: 18px; }
  footer { background: ${headerDark ? '#0f172a' : '#111827'}; color: #cbd5e1; font-size: 13px; padding: 32px 20px 40px; margin-top: 16px; }
  footer .wrap { text-align: center; }
  footer .fbrand { color: #fff; font-weight: 700; margin-bottom: 12px; font-size: 15px; }
  footer .finfo { display: inline-block; text-align: left; margin: 0 auto 14px; }
  footer .finfo div { padding: 3px 0; }
  footer .finfo span { color: #94a3b8; }
  footer .copy { color: #94a3b8; border-top: 1px solid rgba(255,255,255,.1); padding-top: 14px; margin-top: 8px; }
  footer a { color: #e2e8f0; }
</style>
</head>
<body>
  <header>
    <div class="wrap">
      <span class="brand">${fantasia}</span>
      <nav>
        <a href="#sobre">Sobre</a>
        <a href="#servicos">Serviços</a>
        <a href="#contato">Contato</a>
        <a href="#privacidade">Privacidade</a>
      </nav>
    </div>
  </header>

  <main class="wrap">
    <div class="hero">
      ${logo}
      <h1>${razao}</h1>
      <div class="cnpj">CNPJ: ${cnpj}</div>
      ${cfg.situacao ? `<div class="badge">Situação cadastral: ${esc(cfg.situacao)}</div>` : ''}
      <div class="meta">${[atividade, cidadeUf, abertura && `Fundada em ${abertura}`].filter(Boolean).join(' • ')}</div>
    </div>

    <section class="card" id="sobre">
      <h2>Quem Somos</h2>
      <p>${esc(p1)}</p>
      ${p2 ? `<p>${esc(p2)}</p>` : ''}
      <p>${esc(p3)}</p>
      <p>${esc(p4)}</p>
    </section>

    ${
      servicos.length
        ? `<section class="card" id="servicos">
      <h2>Produtos e Serviços</h2>
      ${servicosLista}
    </section>`
        : ''
    }

    <section class="card">
      <h2>Missão, Visão e Valores</h2>
      <div class="mvv">
        <div class="item"><h3>Missão</h3><p>${esc(cfg.missao)}</p></div>
        <div class="item"><h3>Visão</h3><p>${esc(cfg.visao)}</p></div>
        <div class="item"><h3>Valores</h3><p>${esc(cfg.valores)}</p></div>
      </div>
    </section>

    <section class="card">
      <h2>Informações da Empresa</h2>
      <div class="info-grid">${info}</div>
    </section>

    <section class="card" id="contato">
      <h2>Localização e Contato</h2>
      <ul class="contato">${contatoItens}</ul>
      ${wa ? `<div class="cta"><a href="${wa}" target="_blank" rel="noopener">Conversar agora</a></div>` : ''}
      <p class="tagline">Na ${fantasia}, a sua visão é a nossa missão.</p>
    </section>

    <section class="card" id="privacidade">
      <h2>Política de Privacidade</h2>
      <p class="legal">${esc(priv)}</p>
    </section>

    <section class="card" id="termos">
      <h2>Termos de Uso</h2>
      <p class="legal">${esc(termos)}</p>
    </section>
  </main>

  <footer>
    <div class="wrap">
      <div class="fbrand">${razao}</div>
      <div class="finfo">${rodapeInfo}</div>
      <div class="copy">© ${ano} ${razao}. Todos os direitos reservados.</div>
    </div>
  </footer>
</body>
</html>`
}
