# Notas e Insights da Sessão S-03 (Next.js + Tailwind + Shadcn Suite)

## Notas Técnicas
- **Bypass de CORS em Web Apps:** O Next.js Server-Side (API Routes) foi utilizado de forma brilhante como proxy reverso para as chamadas autenticadas do Instagram e do X (Twitter), eliminando qualquer barreira de CORS do navegador no localhost ou produção.
- **Autenticação Segura por Cookies:** Os cookies de sessão (`auth_token`/`ct0` para X; `sessionid`/`ds_user_id` para Instagram) são inseridos pelo usuário de forma segura e armazenados apenas no `localStorage` local do próprio cliente, sem passar por bancos de dados externos.
- **Componentização com Tailwind v4 e Shadcn:** Criamos implementações puras e resilientes dos stubs Shadcn UI (`Button`, `Card`, `Checkbox`, `Tabs`, `Slider`) integrados com o compilador do Tailwind CSS v4, mantendo a performance excelente e com visual minimalista moderno.
- **Bypass de Exportações Ausentes do Lucide:** Ícones de marcas famosas como `Instagram` e `Twitter` foram substituídos por SVGs inline desenhados sob medida nos componentes, tornando a compilação do Turbopack totalmente independente e imune a atualizações e quebras de exportação do pacote `lucide-react`.

## 🔁 Redesenho da Sessão
Como critério de redesenho ("o que faremos diferente no próximo ciclo?"):
- **Redesenho de Dependências:** Para logotipos e elementos gráficos de redes sociais e marcas proprietárias, preferir sempre SVGs inline puros em vez de importar de bibliotecas de ícones dinâmicas, para evitar conflitos de compilação ou deprecamento de marcas.
- **Resiliência de Rede:** Em proxies de API routes que enviam cookies complexos no header, sempre tratar e sanitizar as strings de cabeçalho `Cookie` no backend para evitar quebras em requests que não contenham todos os parâmetros opcionais.
