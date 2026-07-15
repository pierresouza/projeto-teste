# Decisões Tomadas nesta Sessão

## D-01: Extensão Nativa Baseada em Vanilla JS (SPA Autônoma)
- **Decisão:** Criar a extensão usando HTML/CSS/JS estático modular autônomo na pasta `instagram-unfollow-extension/`.
- **Alternativa Rejeitada:** Tentar configurar a compilação do Next.js com `output: 'export'` diretamente como extensão do Chrome.
- **Justificativa:** O Next.js compilado estaticamente gera scripts de hidratação e estruturas que colidem com as políticas de segurança de conteúdo (CSP) rígidas do Manifest V3 do Chrome. O empacotamento em Vanilla JS (reescrito de forma limpa a partir dos nossos componentes React) elimina qualquer risco de erro de CSP ou no empacotamento, rodando nativamente sem compilação intermediária.

## D-02: Uso do chrome.cookies API para Automação
- **Decisão:** Utilizar a permissão `cookies` no manifest para consultar o cookie de sessão logada `ds_user_id` e extrair o ID numérico do usuário do Instagram automaticamente.
- **Alternativa Rejeitada:** Pedir para o usuário digitar seu ID ou login do Instagram.
- **Justificativa:** A leitura automática de cookies fornece a melhor experiência possível (UX direta) de forma transparente e segura, eliminando digitação ou exposição de senhas.

## D-03: Abertura em Tela Cheia no background.js
- **Decisão:** Usar `chrome.action.onClicked.addListener` no Service Worker para abrir o `index.html` em uma aba comum do Chrome (`chrome.tabs.create`), ao invés de usar um popup padrão `default_popup`.
- **Alternativa Rejeitada:** Abrir em um pequeno painel popup no ícone da extensão.
- **Justificativa:** O Dashboard de conexões e a grade de cards são complexos e requerem espaço de tela (desktop/tablet) para visualização confortável. A aba cheia fornece a melhor legibilidade e usabilidade para o Quick Decider e listagem.
