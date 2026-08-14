# Exemplo 3: /docs:tarefa e /docs:decidir — o caminho documentação → código

Sessão sobre [`fixtures/pedidos/`](fixtures/pedidos/), no estado em que o
fixture está: Fase 1 (reembolso parcial) aberta, T1.1 travada por uma decisão
em aberto no SPEC. Blockquotes em itálico são anotações; o resto é a sessão.

Os dois comandos aparecem juntos porque é assim que são usados: o briefing
mostra que falta uma decisão, a decisão é registrada, e só então a
implementação começa. **Nenhum dos dois escreve código.**

---

**Usuário:** `/docs:tarefa T1.1`

**Agente:** [lê `~/.claude/docs-kit/GRAMATICA.md`; localiza T1.1 no PLAN; lê
CLAUDE.md, SPEC.md, DOMAIN.md e `src/estados.js`]

**`T1.1 — invariante do reembolso no DOMAIN antes do código`** · módulo
`estados` · fase `1 — Reembolso parcial`

- **O que fazer** — formular a lei do reembolso no DOMAIN.md, com id, antes de
  existir código de reembolso. A tarefa entrega um invariante numerado e o
  critério de aceitação do SPEC que o cita — nada mais.
  **Fora dela:** o estado `reembolsado_parcial` é T1.2 e o cálculo é T1.3.
  Adicionar transição aqui é vazar escopo.
- **Onde** — `DOMAIN.md` (Invariantes) e `SPEC.md` (Critérios de aceitação).
  `src/estados.js` fica **intocado** nesta tarefa. O padrão a imitar está nos
  invariantes I1 e I2: a lei em uma frase absoluta, seguida de onde ela é
  garantida hoje e de como se verifica que continua valendo.
- **Contrato vigente** — regra de ouro: **nenhuma regra de domínio existe fora
  de `src/`; quem chama decide quando, nunca se pode**. As convenções que
  tocam aqui: invariante novo entra no DOMAIN antes do código que o sustenta
  (código primeiro produz lei retroajustada ao que foi implementado); todo
  `I<n>` tem pelo menos um teste que o nomeia no título.
- **Não pode** —
  - `I1` (pedido cancelado nunca volta a um estado de venda): o invariante novo
    não pode abrir um caminho de volta a partir de `cancelado`.
  - `I2` (estado terminal não tem saída): se a formulação exigir saída de
    `enviado`, ela contradiz I2 — e aí I2 é que precisa mudar, deliberadamente.
  - "Nunca dar saída a um estado terminal sem antes mudar o invariante no
    DOMAIN" — o código passaria a contradizer a lei declarada.
- **O que prova** — os testes vêm primeiro (disciplina TDD do PLAN): reembolso
  maior que o total pago é recusado; soma de reembolsos parciais nunca
  ultrapassa o pago. Aceitação: o invariante existe no DOMAIN com id, e o SPEC
  o cita no critério correspondente.
- **Dependências e riscos** — **a tarefa está travada.** O SPEC tem uma decisão
  em aberto que a afeta:

  > `- [ ] **Estorno em pedido enviado** — hoje `enviado` é terminal e o estorno
  > acontece fora do domínio; trazer para cá cria um segundo caminho de saída e
  > mexe em I2 (afeta T1.1).`

  Enquanto ela não fechar, não há como formular o invariante: ele muda de forma
  conforme o estorno em `enviado` entre ou não no domínio. Rode
  `/docs:decidir resolver Estorno em pedido enviado` antes de implementar.
- **Buracos** — o DOMAIN não diz se o reembolso é registrado como valor
  acumulado ou como lista de eventos. A escolha muda a formulação do invariante
  ("a soma dos reembolsos" pressupõe a lista). Candidato a `/docs:decidir`
  quando a implementação chegar.

> _O briefing não é o CLAUDE.md despejado: são só as convenções, proibições e
> invariantes que tocam esta tarefa. E ele para de propor implementação quando
> encontra uma decisão que a bloqueia — regra 6 tem um executor agora, e é o
> comando abaixo._

---

**Usuário:** `/docs:decidir resolver Estorno em pedido enviado`

**Agente:** [lê a gramática; localiza a decisão]

A decisão está no **SPEC.md**, seção "Decisões em aberto (a confirmar)" — é
decisão de escopo de produto, e a jurisdição confere (regra 8).

Antes de propor o diff, preciso da resolução: o estorno de pedido `enviado`
entra no domínio, ou continua fora?

**Usuário:** continua fora. quem estorna pedido enviado é o financeiro, por
fora, e a gente não quer isso no core

**Agente:** Então a resolução é uma **exclusão de escopo** (linha 4 da tabela
de classificação): o caminho foi descartado com custo conhecido, e alguém pode
re-propor.

Diff proposto — a linha pendente sai, e o que ela produziu entra:

```diff
 ### Fora do escopo

 - Persistência: a biblioteca não conhece banco, arquivo nem rede.
 - Desconto em valor fixo: o domínio só tem desconto proporcional (DOMAIN.md,
   glossário); aceitar valor fixo criaria duas aritméticas para conciliar.
+- Estorno de pedido `enviado`: o estorno acontece no financeiro, fora do
+  domínio. Trazê-lo para cá abriria um segundo caminho de saída de um estado
+  terminal e mexeria em I2.
```

```diff
-## Decisões em aberto (a confirmar)
-
-- [ ] **Estorno em pedido enviado** — hoje `enviado` é terminal e o estorno
-      acontece fora do domínio; trazer para cá cria um segundo caminho de saída
-      e mexe em I2 (afeta T1.1).
+## Decisões em aberto (a confirmar)
+
+Nenhuma pendente.
```

Uma decisão, uma edição — não vou arrumar o resto do documento nesta viagem.

> _`resolvido: ...` não aparece em lugar nenhum. A linha pendente sai e o
> produto dela entra: a exclusão de escopo é a guarda contra alguém re-propor
> estorno no core em seis meses, e é ela que muda o comportamento de um agente.
> O registro de que houve uma decisão não muda nada — fica no git e no diff que
> você está aprovando agora (regra 7)._

**Usuário:** ok

**Agente:** [escreve]

`node ~/.claude/bin/docscheck.mjs .` — limpo.

Registrado: exclusão de escopo do estorno de pedido enviado, em SPEC §Fora do
escopo. Saiu: a decisão em aberto correspondente; a seção passou a declarar
"Nenhuma pendente." Nada mais foi tocado, e o marcador de rodada não foi
atualizado — quem fecha marco é `/docs:rodada`.

> _Com a decisão fechada, `/docs:tarefa T1.1` volta a devolver um briefing sem
> bloqueio: o invariante agora pode ser formulado com `enviado` permanecendo
> terminal. O ciclo é esse — o doc-set destrava a implementação, e a
> implementação alimenta o doc-set de volta._
