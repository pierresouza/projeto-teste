# Notas e Insights da Sessão S-02

## Notas Técnicas
- A detecção de cookies (`chrome.cookies`) é condicional, ou seja, se a página for aberta diretamente em um servidor local fora do Chrome Extension (ex: `http-server`), o código não lança erros.
- **Carregamento sob Demanda (Lazy Loading):** Buscar as fotos do perfil de forma individualizada no Quick Decider elimina rate limit do Instagram, carregando dados na velocidade da leitura humana e sem sobrecarregar a rede ou bloquear a conta.
- **Checagem de Usuário Ativo:** A verificação `qdActiveList[qdCurrentIndex]?.username === activeUser` no callback do fetch evita condições de corrida (quando o usuário passa rápido o cartão e a imagem da requisição anterior renderiza no novo perfil).
- **Fallback Graciosos:** Caso a requisição retorne erro ou CORS (fora da extensão), a interface retorna perfeitamente para as iniciais estilizadas, sem causar elementos quebrados.
- **Resolução de Bloqueio de Referer (Weserv Proxy):** O Instagram CDN bloqueia requisições de domínios não reconhecidos (como `chrome-extension://`). O uso do proxy de imagens `images.weserv.nl` contorna essa limitação perfeitamente, removendo os cabeçalhos de domínio.
- **Tratamento onerror no DOM/React:** A injeção de imagens com tratamento dinâmico de `onload` e `onerror` evita que imagens quebradas mostrem o texto alternativo (alt text) e deformem a interface, servindo de barreira visual robusta.
- **Exclusão em Segundo Plano (Direct POST Request):** O uso da extensão Chrome com permissões de cookies permite realizar chamadas de POST autenticadas à API interna do Instagram (`/api/v1/friendships/destroy/{user_id}/`) sem barreiras de CORS, simulando as ações da aba ativa.
- **Throttling e Trava Física de UX:** Para evitar bans por comportamento robótico frenético (rate limits de cliques rápidos), a imposição de uma trava visual de 2.5s desativando botões e teclado no Dashboard e no Quick Decider se provou uma excelente barreira de segurança defensiva.
- **Resolução Dinâmica de IDs:** Implementar a verificação de existência do ID numérico de usuário (`pk`) e a busca via endpoint `/web_profile_info/` para resolver nomes de usuário garante que dados legados ou importações oficiais de ZIP (que não possuem o ID numérico nativo) continuem funcionando no modo de segundo plano.

## 🔁 Redesenho da Sessão
Como critério de redesenho ("o que faremos diferente no próximo ciclo?"):
- **Redesenho:** Para ferramentas utilitárias que dependem de sessão web ou cookies, propor logo no início uma extensão de navegador (Manifest V3), pois ela contorna a restrição de CORS.
- **Redesenho de Performance:** Em consultas adicionais de dados de perfis, preferir sempre o carregamento assíncrono sob demanda (Lazy Loading) em vez de buscas em lote (batching) na tela de carregamento principal para evitar bloqueios ou lentidões.
