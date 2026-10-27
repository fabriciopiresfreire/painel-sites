# Painel de Sites

Painel para criar, publicar e gerenciar landing pages institucionais com dominio proprio.

## O que faz

- Cria sites institucionais a partir de templates (Corporativo, Esmeralda, Grafite)
- Preenche dados da empresa automaticamente via CNPJ (BrasilAPI)
- Publica o site em um slug (ex.: `/s/minha-empresa`) ou em dominio proprio
- Gerencia verificacao de dominio da Meta (Facebook Business)
- Compra de dominios via Cloudflare Registrar (opcional)

## Stack

- **Front:** React 18 + Vite + TypeScript + Tailwind CSS (tema dark)
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + RLS)
- **Landing pages:** Cloudflare Worker (serve os sites publicados)
- **Dominios:** Cloudflare Workers Custom Domains (SSL automatico)
- **Hospedagem do painel:** Cloudflare Pages

## Estrutura

```
src/                    Front-end React
  components/           Componentes reutilizaveis
  context/              AuthContext (login/sessao)
  lib/                  Logica de negocio (sites, dominios, templates, tipos)
  pages/                Paginas do painel
worker/                 Cloudflare Worker que serve as landings
  src/index.js          Roteador (slug ou dominio proprio)
  src/template.js       Renderizador HTML dos templates
supabase/
  migrations/           Schema do banco (aplicar em ordem)
  functions/            Edge Functions (dominios, registrar, cnpj)
```

## Setup passo a passo

### 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd painel-sites
npm install
```

### 2. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a URL e a anon key do projeto (Settings > API)
3. Crie o `.env` a partir do exemplo:
   ```bash
   cp .env.example .env
   ```
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
5. Instale a CLI do Supabase e linke o projeto:
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   ```
6. Aplique as migrations:
   ```bash
   npx supabase db push
   ```
7. Crie um usuario no Supabase Auth (Dashboard > Authentication > Users > Add user)

### 3. Rodar o painel (dev)

```bash
npm run dev
```
Acesse `http://localhost:5174/`

### 4. Cloudflare Worker (serve as landings)

```bash
cd worker
npm install
```

Configure os segredos do Worker:
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

Deploy:
```bash
npx wrangler deploy
```

Copie a URL do Worker e preencha `VITE_WORKER_URL` no `.env` do front.

### 5. Deploy do painel (Cloudflare Pages)

```bash
npm run build
npx wrangler pages project create painel-sites
npx wrangler pages deploy dist --project-name painel-sites --branch main
```

### 6. Dominio proprio (opcional)

Para vincular dominios proprios aos sites publicados:

1. O dominio precisa ser uma zona na sua conta Cloudflare
2. Configure os segredos da Edge Function `dominios` no Supabase Dashboard:
   - `CF_API_TOKEN` (Account > Workers Scripts:Edit + Zone DNS:Edit + Zone:Read)
   - `CF_ACCOUNT_ID` (id da sua conta Cloudflare)
3. Deploy da Edge Function:
   ```bash
   npx supabase functions deploy dominios
   ```
4. No painel: publique o site -> tela Dominios -> Vincular

### 7. Verificacao Meta (Facebook Business)

Para verificar dominios no Facebook Business Manager:

- **Por meta tag:** edite o token `SEU_TOKEN_AQUI` em `src/lib/templates.tsx` e `worker/src/template.js`
- **Por arquivo HTML (self-service):** no painel, use o botao "Verificacao Meta" no card do site
- **Tokens fixos (legado):** adicione ao mapa `META_VERIFICACAO` em `worker/src/index.js`

### 8. Comprar dominio pelo painel (opcional)

1. Configure `CF_API_TOKEN` com permissao **Account > Registrar: Edit**
2. Tenha metodo de pagamento na conta Cloudflare
3. Deploy da Edge Function:
   ```bash
   npx supabase functions deploy registrar
   ```
4. Deploy da Edge Function de CNPJ:
   ```bash
   npx supabase functions deploy cnpj
   ```

## Segredos necessarios (resumo)

| Onde | Variavel | Descricao |
|------|----------|-----------|
| `.env` (front) | `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `.env` (front) | `VITE_SUPABASE_ANON_KEY` | Chave anon/public do Supabase |
| `.env` (front) | `VITE_WORKER_URL` | URL do Worker Cloudflare |
| Worker (wrangler secret) | `SUPABASE_URL` | URL do projeto Supabase |
| Worker (wrangler secret) | `SUPABASE_ANON_KEY` | Chave anon/public do Supabase |
| Supabase Edge Functions | `CF_API_TOKEN` | Token Cloudflare API |
| Supabase Edge Functions | `CF_ACCOUNT_ID` | ID da conta Cloudflare |

## Templates disponiveis

- **Corporativo (Azul):** institucional com cor primaria azul
- **Esmeralda (Verde):** institucional com cor primaria verde
- **Grafite (Escuro):** institucional com fundo escuro

Os templates geram um site completo com: header, Quem Somos, Produtos/Servicos, Informacoes da Empresa, Politica de Privacidade (LGPD), Termos de Uso e rodape com dados completos.
