# Contexto Inicial da Sessão

## Motivação
A necessidade do usuário de carregar seus dados sem ter que esperar a Meta processar o download oficial (até 4 dias) foi resolvida inicialmente com a cópia de um script JavaScript de console. Para otimizar ainda mais a usabilidade e automatizar esse processo (removendo a necessidade de o usuário lidar com consoles de desenvolvedores ou colar scripts manuais), o usuário solicitou o empacotamento do gerenciador como uma Extensão do Chrome.

## Posição de Partida
O projeto possuía uma aplicação Next.js funcional na subpasta `instagram-unfollow/` com suporte a importação de JSON oficiais e via script de console. Havia ausência de arquivos específicos de extensão ou empacotamento nativo.

## Restrições & Escopo
- Utilizar a API do Chrome Extensão de forma 100% segura.
- Adicionar detecção automática de cookies logados no Instagram.
- Fornecer uma interface semântica de aba inteira para navegação amigável.
- Rodar offline no cliente com persistência de dados local.
