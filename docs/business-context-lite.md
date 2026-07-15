# Business Context

> Este arquivo é a **SSOT (fonte única de verdade) de Produto** — outros artefatos CITAM este arquivo, nunca duplicam seu conteúdo. O agente `@product` o atualiza a cada descoberta.

## 1. Visão do Produto
O **Instagram Unfollow Manager** é uma aplicação web simples, segura e local que ajuda os usuários a gerenciar a lista de contas que eles seguem no Instagram. Através do upload de arquivos de dados oficiais exportados pelo Instagram (JSONs de followers e following), o sistema permite cruzar os dados instantaneamente, filtrar quem não segue de volta e gerenciar o unfollow de forma rápida e assistida, sem riscos de bloqueio de conta.
- **Fora do escopo (não-objetivos):** Login direto com credenciais do Instagram (para evitar bloqueios ou vazamento de dados), automação robótica pesada de cliques que viole os termos de uso do Instagram no backend.

## 2. Público & Personas
| Persona | Quem é | Contexto de uso |
|---|---|---|
| Organização Pessoal | Usuários comuns do Instagram que acumularam centenas de "seguindo" e desejam limpar seu feed. | Querem uma forma rápida e visual no computador ou celular para decidir quem manter ou dar unfollow. |
| Criadores de Conteúdo | Profissionais que querem balancear a métrica "Seguindo/Seguidores" e remover perfis inativos. | Usam no desktop com listas grandes de perfis, precisando de filtros específicos de reciprocidade. |

## 3. Dores do Cliente (Problemas que resolvemos)
| Dor | Impacto (o que custa hoje) |
|---|---|
| Dificuldade em identificar quem não segue de volta | O usuário precisa verificar manualmente perfil por perfil no aplicativo oficial, um processo lento e exatual. |
| Risco de banimento ao usar apps de terceiros | Apps que exigem login direto no Instagram realizam automação ilegal de API, resultando em bloqueio temporário ou permanente da conta do usuário. |
| Falta de visualização organizada para faxina digital | O app do Instagram não oferece filtros avançados ou um fluxo de revisão rápida (estilo cartão/fila) para tomar decisões de unfollow de forma eficiente. |

## 4. Objetivos & Métricas de Sucesso
- **Objetivo:** Permitir ao usuário revisar sua lista de seguindo e realizar unfollows com segurança e rapidez.
- **Como medimos:** Tempo economizado no cruzamento de dados (instantâneo via upload de JSON) e número de cliques necessários para tomar a decisão de manter/unfollow.

## 5. Backlog de Épicos e Features
> Este é o **quadro de tasks** de Produto (Task Manager Lite). Status: `A Fazer → Pronto para Dev → Em Dev → Feito`.

| ID | Título | Status | Notas |
|---|---|---|---|
| F-01 | Importador de Dados do Instagram (JSON) | Feito | Permite fazer upload dos arquivos followers.json e following.json (ou o combinado instagram_connections.json via console) e processá-los localmente. |
| F-02 | Painel de Reciprocidade & Filtros | Feito | Exibição de estatísticas e filtros (Não me seguem de volta, Seguidores mútuos, Apenas eu sigo). |
| F-03 | Gerenciador de Decisão Rápida (Unfollow Fila) | Feito | Interface em cartões para decidir individualmente por "Manter" ou "Deixar de seguir" (abrindo o perfil do Instagram correspondente). |
| F-04 | Extensão do Chrome Instalável | Feito | Empacotamento como extensão de navegador focado em detecção e validação de sessão ativa local de forma segura. |
| F-05 | Social Suite Web App | Feito | Migração e unificação de ferramentas para uma aplicação web com Next.js, Tailwind e Shadcn UI com API Proxies. |


## 6. Especificações Ativas (Em Detalhe)
### F-01 — Importador de Dados do Instagram (JSON)
**História:** Como usuário do Instagram, quero fazer upload dos arquivos de seguidores e seguindo no sistema (seja via exportação oficial ou via extração rápida por script de console) para que meus dados de conexão sejam carregados de forma local e segura.
**Critérios de Aceite:**
- Dado que o usuário tem os arquivos exportados da Meta OU o arquivo combinado gerado pelo console, quando ele os arrasta ou faz upload no sistema, então o sistema lê e valida os JSONs correspondentes.
- Dado que os JSONs são válidos, quando processados, então o sistema extrai o username, a URL do perfil e a data de seguimento.
- Dado que a página de upload é exibida, quando o usuário seleciona a aba de método rápido, então o sistema fornece instruções detalhadas e permite copiar o script extrator com um clique.
- Dado que os arquivos foram carregados com sucesso, quando a importação termina, então o sistema redireciona para a interface do dashboard e salva o estado no localStorage para evitar re-upload ao atualizar.

### F-02 — Painel de Reciprocidade & Filtros
**História:** Como usuário que deseja limpar seu perfil, quero visualizar as estatísticas de quem sigo e filtrar quem não me segue de volta para facilitar a tomada de decisão.
**Critérios de Aceite:**
- Dado que o sistema carregou os dados, quando o usuário entra no dashboard, então exibe contagens de: "Seguindo", "Seguidores", "Não me seguem de volta" e "Seguidores Mútuos".
- Dado que o usuário clica em um filtro (ex: "Não me seguem de volta"), quando a lista atualiza, então mostra apenas os usuários daquela categoria em uma grade responsiva com links diretos e botões de ação.
- Dado que o usuário quer buscar um perfil específico, quando ele digita na barra de busca, então a lista é filtrada em tempo real por username.

### F-03 — Gerenciador de Decisão Rápida (Unfollow Fila)
**História:** Como usuário que está fazendo uma faxina no perfil, quero um fluxo simplificado onde eu possa analisar perfil por perfil rapidamente e dar unfollow nas contas selecionadas.
**Critérios de Aceite:**
- Dado que há perfis na lista filtrada, quando o usuário seleciona "Modo Decisão Rápida", então o sistema exibe um cartão por vez do perfil selecionado com links rápidos.
- Dado que o usuário clica em "Manter", quando a ação ocorre, então o sistema pula para o próximo cartão e marca o usuário como revisado (mantido).
- Dado que o usuário clica em "Unfollow", quando a ação ocorre, então o sistema abre o perfil do usuário do Instagram em uma nova aba (ou guia secundária) com foco, marca como "Para deixar de seguir" e avança na fila local.
- Dado que o usuário quer exportar uma lista de quem ele decidiu dar unfollow, quando o processo termina, então ele pode baixar um arquivo contendo a lista dos nomes dos usuários ou copiar instruções de automação via console (DevTools).

### F-04 — Extensão do Chrome Instalável
**História:** Como usuário que deseja o máximo de praticidade, quero usar a aplicação como uma Extensão do Chrome para carregar meus seguidores e seguindo de forma 100% automática e offline, sem precisar baixar arquivos manualmente ou colar scripts no console.
**Critérios de Aceite:**
- Dado que o usuário instala a extensão, quando ele clica no ícone dela no navegador, então abre uma nova aba em tela cheia com o painel completo do aplicativo.
- Dado que a extensão é aberta, quando o usuário está logado no Instagram Web, então o sistema detecta os cookies ativos e exibe o botão "Extrair Conexões de Forma Automática".
- Dado que o usuário não está logado no Instagram, quando a extensão inicia, então ela exibe um aviso claro instruindo-o a abrir o Instagram.com e fazer login antes de extrair os dados.
- Dado que a extração automática é iniciada, quando concluída, então os dados são carregados instantaneamente no Dashboard sem a necessidade de baixar ou subir arquivos locais.

## 7. Pendências de Validação
- Nenhuma pendência no momento.

## 8. 🔁 Redesenhos
> A casa do redesenho de Produto: todo checkpoint de fechamento do Ciclo de Produto registra aqui **o que faremos diferente**.

| Data | Ciclo/Feature | O que muda no próximo ciclo |
|---|---|---|
| 2026-07-14 | Inicialização | Primeira especificação criada para o Instagram Unfollow Manager. |
| 2026-07-14 | Finalização do Ciclo | Features F-01, F-02 e F-03 concluídas com sucesso. |
| 2026-07-14 | Chrome Extension | Decidido encapsular o projeto em uma Extensão do Chrome para automação total de extração offline. |

---
> **Graduação:** ao adotar o [Sistema Onion completo](https://onionevolve.com), cada seção expande para sua camada em `docs/business-context/` — §1/§4/§5/§6 → `02-product/` · §2/§3 → `01-customer/` · §7 → convenção `[INFERIDO]` do core. Zero retrabalho.
