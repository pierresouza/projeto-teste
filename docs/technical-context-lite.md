# Technical Context

> Este arquivo é a **SSOT (fonte única de verdade) de Engenharia** — outros artefatos CITAM este arquivo, nunca duplicam seu conteúdo. O agente `@engineer` o atualiza a cada mudança de arquitetura.

## 1. Stack Tecnológica
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** JavaScript (ES6+)
- **Estilização:** CSS Modules / Vanilla CSS (conforme guidelines de CSS puro)
- **Persistência de Dados:** `localStorage` do navegador no lado do cliente.
- **Hospedagem/Execução:** Servidor Next.js local (`npm run dev`).

## 2. Padrões de Código & Gotchas
- **Componentes React Funcionais:** Uso de hooks modernos (`useState`, `useEffect`, `useMemo`, `useCallback`).
- **Segregação Client/Server:** Como lidamos com dados do localStorage e FileReader, a maior parte da interface de análise de dados será composta por Client Components (`"use client"`).
- **UI Responsiva & Moderna:** Uso de CSS custom variables para design system unificado, transições suaves (`transition: all 0.3s ease`), layout flexível (Grid/Flexbox) e suporte a Dark Mode.
- **Gotchas (armadilhas conhecidas):**
  - Hidratação no Next.js: O `localStorage` só está disponível no cliente. Para evitar erros de hidratação (hydration mismatch), devemos carregar os dados em um `useEffect` após o componente ser montado no cliente.
  - O formato do JSON exportado pelo Instagram pode mudar ligeiramente ao longo do tempo. A análise do JSON deve ser resiliente a variações de chaves.
  - Restrições de segurança do navegador (CORS) impedem o app de fazer requisições diretas ao Instagram. O unfollow será assistido abrindo o perfil em uma nova guia.

## 3. Arquitetura & Mapa do Código
A aplicação Next.js será inicializada no diretório `instagram-unfollow/`. A estrutura de arquivos principal será:

```
instagram-unfollow/
├── src/
│   ├── app/
│   │   ├── layout.js       (Layout global, metadados e reset de estilos)
│   │   ├── page.js         (Página principal - Onboarding e Dashboard do app)
│   │   └── globals.css     (Variáveis globais CSS, design system e reset)
│   └── components/
│       ├── FileUpload.js   (Componente de upload de JSON e onboarding)
│       ├── Dashboard.js    (Painel de métricas e controle de filtros)
│       └── QuickDecider.js (Fila de cartões de perfil para decisão rápida)
```

## 4. Decisões Técnicas (ADR-lite)
> Toda decisão de arquitetura/tecnologia com trade-off entra aqui — é o que evita rediscutir o mesmo tema.

| Data | Decisão | Alternativa rejeitada | Porquê |
|---|---|---|---|
| 2026-07-14 | Next.js App Router (Client-Side State) | Aplicação Backend (Node.js/Python) | Next.js fornece uma estrutura robusta de componentes e roteamento. O estado permanece 100% no cliente (localStorage) para segurança absoluta contra bloqueio de conta. |
| 2026-07-14 | Unfollow Assistido (Abertura de Aba) | Automação de Cliques por Extensão | Uma extensão de navegador é complexa de instalar e manter. O unfollow assistido abrindo perfil oficial é seguro, simples e nativo. |
| 2026-07-14 | Extração Rápida via Console JS | Extensão de Navegador Dedicada | Uma extensão de navegador é complexa de programar e perigosa para o usuário instalar. O script do console roda dentro da própria sessão logada do usuário no Instagram.com, gerando e baixando um JSON combinado instantaneamente. |

## 5. Planos de Implementação Ativos
### Plano para o Instagram Unfollow Manager (Feature F-01 a F-03)
- [x] Inicializar o projeto Next.js em `instagram-unfollow/` [Feito]
- [x] Configurar o design system em `src/app/globals.css` (CSS Modules e CSS custom variables) [Feito]
- [x] Criar o componente de upload de arquivos JSON em `FileUpload.js` [Feito]
- [x] Implementar a lógica de parsing e cruzamento de dados seguidores/seguindo [Feito]
- [x] Criar o painel principal em `Dashboard.js` com estatísticas e filtros de reciprocidade [Feito]
- [x] Criar o visualizador de fila em `QuickDecider.js` com cartões dinâmicos de decisão [Feito]
- [x] Garantir resiliência contra erros de hidratação (localStorage check no client) [Feito]
- [x] Testar e validar localmente no navegador rodando o dev server (`npm run dev`) [Feito]
- [x] Atualizar o componente FileUpload.js para suportar aba dupla (Upload de Arquivos vs Extração Rápida) [Feito]
- [x] Escrever e embutir o script JavaScript extrator de console com funcionalidade de cópia rápida [Feito]
- [x] Atualizar o parser de FileUpload.js para suportar o arquivo combinado de conexões [Feito]
- [x] Criar a estrutura e o manifest.json da extensão Chrome em `instagram-unfollow-extension/` [Feito]
- [x] Criar o service worker background.js da extensão [Feito]
- [x] Traduzir e consolidar as folhas de estilo globais e modulares em style.css da extensão [Feito]
- [x] Implementar o HTML principal index.html (SPA) e a lógica app.js com detecção de cookies e extração automática [Feito]
- [x] Validar localmente carregando a extensão no Chrome (Dogfooding) [Feito]
- [x] Implementar a busca e exibição de fotos de perfil reais sob demanda (Lazy Loading) no Quick Decider (Extensão e Next.js) [Feito]
- [x] Corrigir bloqueio de referer na CDN usando o proxy de imagem Weserv e adicionar onerror de resiliência [Feito]
- [x] Implementar a funcionalidade de unfollow automático em segundo plano com trava física de 2.5s (Extensão do Chrome) [Feito]
- [x] Simplificar a extensão do Instagram mantendo exclusivamente a detecção de login (HTML/JS/CSS) [Feito]
- [x] Criar o HTML index.html e o CSS style.css da extensão X Repost Deleter no Twitter [Feito]
- [x] Implementar o app.js da extensão Twitter com verificação de rota GraphQL para apagar republicados [Feito]
- [x] Validar e carregar ambas as extensões no Chrome (Dogfooding) [Feito]
- [x] Instalar dependências essenciais no Next.js (lucide-react, radix-ui primitives) [Feito]
- [x] Criar componentes Shadcn UI stubs em `src/components/ui/` (Button, Card, Checkbox, Tabs, Slider) [Feito]
- [x] Criar as rotas de API Server-side no Next.js (Proxy de cookies/CORS) para Instagram e Twitter [Feito]
- [x] Criar a página principal (Hub) de boas-vindas `/` com Tailwind e Shadcn [Feito]
- [x] Implementar a página do Instagram `/instagram` com Dashboard e Quick Decider portados para Tailwind e Shadcn [Feito]
- [x] Implementar a página do Twitter `/twitter` com abas de Limpeza, Gerenciador de Conexões e Terminal Logs [Feito]
- [x] Validar build de produção (`npm run build`) e rodar servidor dev para testes localmente [Feito]
- [x] Configurar a exportação estática (output: 'export') em `next.config.mjs` [Feito]
- [x] Criar os arquivos `manifest.json` e `background.js` dentro da pasta `public/` do Next.js [Feito]
- [x] Implementar a leitura automática de cookies usando a API `chrome.cookies` no `page.jsx` do Instagram [Feito]
- [x] Implementar a leitura automática de cookies usando a API `chrome.cookies` no `page.jsx` do Twitter [Feito]
- [x] Validar compilação estática (`npm run build`) gerando a pasta `out/` com manifesto e service worker [Feito]
- [ ] Carregar a pasta compilada `out/` no Chrome e verificar a detecção automática de sessão [Em Dev]



## 6. Débitos & Riscos Conhecidos
- Acoplamento com o formato de arquivo JSON do Instagram. Alterações futuras no layout de exportação de dados da Meta podem exigir atualizações no parser.

## 7. 🔁 Redesenhos
> A casa do redesenho de Engenharia: todo checkpoint de fechamento do Ciclo de Engenharia registra aqui **o que muda no processo**.

| Data | Ciclo/Feature | O que muda no próximo ciclo |
|---|---|---|
| 2026-07-14 | Next.js Shift | Mudança de SPA Vanilla estática simples para Next.js solicitada pelo usuário. |
| 2026-07-14 | Conclusão Engenharia | Primeira versão da SPA Next.js totalmente concluída com build validado localmente. |
| 2026-07-14 | Console Extraction | Decidido implementar o método de extração via console JS para contornar a espera de 4 dias do Instagram. |

---
> **Graduação:** ao adotar o [Sistema Onion completo](https://onionevolve.com), cada seção expande para sua camada em `docs/technical-context/` — §1 → `01-core/project-charter` · §2/§3 → `02-ai-context/` · §4 → `01-core/adr/` (um arquivo por decisão) · §5/§6 → `04-workflow/`. Zero retrabalho.
