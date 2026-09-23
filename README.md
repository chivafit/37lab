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
│   └── guia-saude/            index.html, screens.css, guia-home.png, guia-busca.png
├── page.css                   Estilo das páginas internas (sobre, contato, legais)
├── site-fixes.css             Ajustes globais + estilo da 404
├── home-real.css              Mockup com tela real na home
├── analytics.js               Google Analytics (G-6F1YK4T3TE) + eventos
├── legal-links.js             Injeta links Privacidade/Termos no rodapé
├── favicon.{svg,ico,png}, og-image.svg
└── robots.txt, sitemap.xml
```

## Rodar localmente

```bash
npx serve public
# ou
python3 -m http.server -d public 8000
```

## Deploy

Cada push na branch principal publica automaticamente na Vercel
(config em `vercel.json`: sem build, saída em `public/`, URLs com barra final).
