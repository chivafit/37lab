-- Mensagens enviadas pelo formulário de contato de 37lab.com.br.
-- Só a Edge Function `contact` (service role) escreve aqui; RLS sem políticas
-- bloqueia qualquer acesso pelas chaves públicas (anon/authenticated).
create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) between 3 and 200),
  message     text not null check (char_length(message) between 1 and 5000),
  page        text,
  ip_hash     text,
  email_sent  boolean not null default false,
  email_error text
);

alter table public.contact_messages enable row level security;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
create index if not exists contact_messages_ip_hash_created_at_idx
  on public.contact_messages (ip_hash, created_at desc);
