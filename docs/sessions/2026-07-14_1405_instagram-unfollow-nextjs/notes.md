# Notas e Próximos Passos

## Notas de Desenvolvimento
- A aplicação Next.js foi compilada sem erros após a inclusão do script extrator de console.
- A string do script extrator (`CONSOLE_SCRIPT`) no `FileUpload.js` teve os caracteres de expressão regular (como `\s` e `\d`) devidamente escapados como `\\s` e `\\d` para evitar que a compilação do Next.js e renderização no cliente gerassem quebras ou strings inválidas.
- O parser de JSON foi refatorado para detectar se o arquivo é unificado/combinado (verificando a presença de `.followers` e `.following` no objeto raiz) ou manual (arquivos individuais da Meta).

## 🔁 Redesenho da Sessão
Como critério de redesenho ("o que faremos diferente no próximo ciclo?"):
- **Redesenho:** Para projetos baseados em frameworks (como Next.js), sempre planejar uma subpasta dedicada desde o início em vez de propor Vanilla JS na raiz para evitar conflito com a documentação do repositório Onion.
- **Redesenho Complementar:** Sempre validar com o usuário o tempo de obtenção de dados de APIs fechadas (como a Meta) na Fase de Coleta de Produto para evitar retrabalho de rotas de extração de dados no meio da codificação.

## Próximos Passos
- Oferecer suporte para o usuário copiar o script e rodar na aba do Instagram Web.
- Coletar feedback do fluxo combinado.
