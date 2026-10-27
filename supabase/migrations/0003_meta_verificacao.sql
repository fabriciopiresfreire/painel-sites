-- Verificação de domínio da Meta por site (método "arquivo HTML").
-- Cada site guarda uma lista de arquivos de verificação enviados pelo usuário:
--   [{ "arquivo": "<token>.html", "conteudo": "<token>" }, ...]
-- O Cloudflare Worker serve esse conteúdo em https://<custom_domain>/<arquivo>.

alter table public.painel_sites
  add column if not exists meta_verificacao jsonb not null default '[]'::jsonb;

-- Resolve o conteúdo de um arquivo de verificação da Meta pelo domínio + nome do
-- arquivo. SECURITY DEFINER: ignora RLS, mas devolve só o token (dado público) e
-- NÃO filtra por status — o arquivo precisa responder mesmo com o site em
-- `dominio_pendente` (durante a verificação, antes do SSL ficar ativo).
create or replace function public.painel_verificacao_meta(p_host text, p_arquivo text)
returns text
language sql
security definer
set search_path = public
as $$
  select e->>'conteudo'
  from public.painel_sites s,
       lateral jsonb_array_elements(s.meta_verificacao) e
  where lower(s.custom_domain) = lower(p_host)
    and e->>'arquivo' = p_arquivo
  limit 1;
$$;

revoke all on function public.painel_verificacao_meta(text, text) from public;
grant execute on function public.painel_verificacao_meta(text, text) to anon, authenticated;
