# Exemplo 2: /docs:fundar existente — varredura, relatório em três listas, gate

Sessão do Modo B sobre [`fixtures/notas-api/`](fixtures/notas-api/), em
contexto limpo (o fixture não tem repositório git — de propósito; ver a
degradação no relatório). Blockquotes em itálico são anotações; o resto é a
sessão.

---

**Usuário:** `/docs:fundar existente`

**Agente:** [lê `~/.claude/docs-kit/GRAMATICA.md`; depois varre: manifest,
árvore, configs, documentação existente, git, amostragem de código — sem
perguntar nada antes do relatório]

Relatório de varredura.

**Observado (fatos):**

- Express 4, ESM, `npm start` (package.json). Áreas: `src/routes/` (notas,
  admin) e `src/db.js` (store em memória).
- `package.json` declara `workspaces: ["packages/*"]`, mas `packages/` não
  existe na árvore — fonte contra fonte; o código executa como projeto único.
  Registro a divergência como fato e proponho decisão em aberto abaixo.
- `.env.example`: `API_TOKEN`, `PORT` (apenas os nomes).
- Existe um `CLAUDE.md` de 4 linhas, fora da gramática (sem papel declarado,
  sem regra de ouro).
- Sem testes e sem CI.
- Histórico git indisponível (diretório sem repositório) — fonte pulada; vai
  para "Não determinável". Não improviso vocabulário nem marcos.

**Inferido (com a evidência):**

- Erros em `/notas` seguem objeto-resultado `{ok, erro}` com status explícito
  (padrão consistente em notes.js); `admin.js` lança exceção sem handler.
  Hoje coexistem os dois; padronizar?
- Auth por bearer token é middleware por rota, não global: presente em
  notas, ausente em admin.

**Não determinável pelo código:**

- `/admin` sem guarda de auth: deliberado (rede interna?) ou acidente? Se
  deliberado, entra no inventário "Gaps conhecidos" com o paliativo; se não,
  vira tarefa no PLAN. Não corrijo código nesta tarefa.
- `workspaces` declarado: resto de migração abortada ou plano futuro?
- Fases futuras, prioridades, o que é dívida deliberada.

Cobertura — 0 Regra-de-ouro candidata (com evidência): ainda não — depende da
resposta sobre auth · 1 Áreas: routes/notas, routes/admin, db · 2 Convenções:
objeto-resultado forte em notas; exceção vs resultado em aberto · 3
Segredos/bordas: API_TOKEN via env; borda HTTP única · 4 Gaps/decisões: auth
em admin; workspaces órfão.

Prontidão: refinando — as perguntas acima decidem o relatório final.

Sobre o `CLAUDE.md` existente, três rotas: (1) auditar e atualizar contra o
código; (2) completar apenas os faltantes, respeitando o que existe; (3)
migrar para a gramática da casa preservando o conteúdo (mostro o mapeamento
antes). Qual prefere?

> _O coração do Modo B em uma mensagem: fatos separados de inferências (cada
> uma com evidência), gap virando pergunta em vez de conserto, a divergência
> manifest-vs-árvore registrada sem resolução silenciosa, a fonte git pulada
> com aviso — e o ledger admitindo que a regra de ouro ainda não existe._

**Usuário:** admin é interno, atrás do proxy, deliberado. workspaces é resto
de migração que não rolou, pode limpar. migra o claude.md

**Agente:** "Pode limpar" eu registro, não executo — gap não se conserta
durante a documentação: a remoção do campo `workspaces` entra como tarefa
proposta no PLAN, não como edição minha agora.

Com a resposta sobre auth, a linha 0 do ledger fecha. Regra de ouro proposta:
**toda rota nasce atrás da guarda de auth; a exceção deliberada só existe
registrada em "Gaps conhecidos", com o paliativo nomeado.**

Mapeamento da migração do CLAUDE.md: as 4 linhas atuais viram "Como rodar" e
uma linha de "Estrutura"; o restante é gerado da varredura validada. Com seu
OK, gero SPEC, PLAN e CLAUDE registrando:

- **G1 — `/admin` sem autenticação** — deliberado: exposto só à rede interna,
  atrás do proxy; o paliativo vive na configuração do proxy.
- Decisão em aberto: exceção vs objeto-resultado em admin (padronizar?).
- Tarefa proposta: remover `workspaces` do manifest (resto de migração,
  confirmado nesta conversa).

**Usuário:** ok

**Agente:** [gera na ordem SPEC → PLAN → CLAUDE. Excerto do CLAUDE.md gerado:]

```
## Gaps conhecidos

1. **G1 — /admin sem autenticação** — deliberado: exposto apenas à rede
   interna, atrás do proxy; o paliativo vive na configuração do proxy.
   Revisitar se a topologia mudar.
```

Checagens de entrega: `docscheck` limpo; fronteira presente/futuro — ok;
critérios de aceitação descrevem o comportamento real verificado — ok;
rastreabilidade (tarefa do workspaces → decisão desta conversa; risco → G1) —
ok; zero placeholder — ok.

Resumo: SPEC.md descreve a API atual (o dump admin incluído — comportamento
real); PLAN.md **abre direto na fase corrente**, com a limpeza do manifest, e
uma linha diz o que já está de pé; CLAUDE.md migrado para a gramática com G1
no inventário e a decisão de padrão de erro em aberto.

> _O PLAN não ganha uma "Fase 0" com o inventário do que já existe marcado
> `[x]`: isso é história, e história que não muda o comportamento de um agente
> não entra (regra 2). O que já está construído é descrito pelo SPEC, no
> presente — e o plano guarda só o que falta._

> _Três regras anti-alucinação em ação: a intenção ("deliberado", "resto de
> migração") só entrou depois de dita pelo usuário; o pedido "pode limpar"
> virou tarefa, não edição; e a documentação existente não foi sobrescrita —
> foi migrada por uma das três rotas, com o mapeamento mostrado antes._
