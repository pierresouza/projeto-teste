# Decisões Tomadas nesta Sessão

## D-01: Uso do Next.js 14 (App Router)
- **Decisão:** Inicializar a aplicação como um projeto Next.js na subpasta `instagram-unfollow/`.
- **Alternativa Rejeitada:** SPA Vanilla estática em HTML simples na raiz do workspace.
- **Justificativa:** Next.js fornece uma organização profissional por componentes React e roteamento limpo. Mantivemos a aplicação em uma subpasta para não colidir com os arquivos informativos e documentações do Onion Mini na raiz.

## D-02: Processamento e Estado 100% Client-Side
- **Decisão:** Executar o parser dos arquivos JSON no navegador usando a `FileReader` API e armazenar os dados de reciprocidade e decisões no `localStorage`.
- **Alternativa Rejeitada:** Servidor backend em Node.js ou Python com automação de navegador (ex: Puppeteer).
- **Justificativa:** Automação robótica direta de APIs viola os termos do Instagram e causa banimento de conta. O processamento cliente é 100% privado, offline e seguro contra bans.

## D-03: Unfollow Assistido com Fila de Abertura de Abas
- **Decisão:** Quando o usuário clica em "Unfollow" na grade ou no Quick Decider, o sistema abre o perfil oficial do usuário do Instagram em uma nova aba do navegador para que ele realize a ação nativa, enquanto no app local o card é marcado como concluído.
- **Alternativa Rejeitada:** Tentativa de automação de requisições de POST autenticadas via frontend.
- **Justificativa:** Devido a políticas de segurança CORS e integridade de token do Instagram, chamadas diretas são bloqueadas. O unfollow assistido é simples, seguro e à prova de falhas.
