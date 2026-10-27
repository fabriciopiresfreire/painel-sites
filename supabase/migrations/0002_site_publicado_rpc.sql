-- Resolve um site PÚBLICO (publicado/ativo) por domínio próprio OU slug.
-- SECURITY DEFINER: ignora o RLS, mas devolve apenas o necessário para
-- renderizar e somente de sites já publicados. Chamável por anon.
-- É o que o Cloudflare Worker consome para servir a landing.

create or replace function public.painel_resolver_site(p_identificador text)
returns table (template text, config jsonb, nome text)
language sql
security definer
set search_path = public
as $$
  select s.template, s.config, s.nome
  from public.painel_sites s
  where s.status in ('publicado', 'ativo')
    and (
      lower(s.custom_domain) = lower(p_identificador)
      or lower(s.slug) = lower(p_identificador)
    )
  limit 1;
$$;

revoke all on function public.painel_resolver_site(text) from public;
grant execute on function public.painel_resolver_site(text) to anon, authenticated;
