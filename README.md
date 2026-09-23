# 37LAB — site institucional

Site estático de [37lab.com.br](https://37lab.com.br), migrado do GPT Sites para GitHub + Vercel.
HTML/CSS/JS puros, sem build.

## Estrutura

```
public/
├── index.html                 Home (hero, projetos, serviços, processo, contato)
├── sobre/index.html           Sobre
├── contato/index.html         Contato
├── privacidade/index.html     Política de privacidade
├── termos/index.html          Termos de uso
├── 404.html                   Página de erro (a Vercel usa automaticamente)
├── projetos/
│   ├── projeto.css            Estilo compartilhado dos estudos de produto
│   ├── analyzai/index.html
│   ├── vinde/index.html
│   └── guia-saude/            index.html, screens.css, guia-home.webp, guia-busca.webp
├── page.css                   Estilo das páginas internas (sobre, contato, legais)
├── site-fixes.css             Ajustes globais + estilo da 404
├── home-real.css              Mockup com tela real na home
├── analytics.js               Google Analytics (G-6F1YK4T3TE) + eventos
├── legal-links.js             Injeta links Privacidade/Termos no rodapé
├── contact-form.js            Envio do formulário de contato (Supabase)
├── favicon.{svg,ico,png}, og-image.png (prévia de compartilhamento)
└── robots.txt, sitemap.xml
```

## Rodar localmente

```bash
npx serve public
# ou
python3 -m http.server -d public 8000
```

## Deploy

Projeto Vercel: `37lab` (time analyzai), conectado a este repositório.

- Push na `main` → publica em produção automaticamente.
- Push em outros branches / PRs → gera uma prévia (preview) com URL própria.

Config em `vercel.json`: sem build, saída em `public/`, URLs com barra final.

## Formulário de contato

`public/contato/` envia para a Edge Function `contact` do Supabase (URL em `data-endpoint`
no `<form>`). A função grava em `public.contact_messages` e avisa por e-mail via Gmail.
Se `data-endpoint` estiver vazio ou o envio falhar, o formulário abre o e-mail do visitante
(mailto) como alternativa.

```
supabase/
├── migrations/20260923000000_contact_messages.sql   tabela (RLS ligado, sem acesso público)
└── functions/contact/index.ts                        validação, anti-spam, gravação e e-mail
```

Secrets da função (Supabase → Edge Functions → Secrets):

| Nome                 | Valor                                                        |
| -------------------- | ------------------------------------------------------------ |
| `GMAIL_USER`         | Gmail que envia o aviso                                      |
| `GMAIL_APP_PASSWORD` | senha de app do Google (myaccount.google.com/apppasswords)   |
| `NOTIFY_TO`          | opcional — destino do aviso (padrão: `GMAIL_USER`)           |

As mensagens ficam em **Table Editor → contact_messages**; `email_sent`/`email_error`
mostram se o aviso saiu.
