# docs tarefa

Este é o caminho documentação → código. O doc-set existe para que uma sessão
saiba o que fazer e sob quais regras; este comando extrai isso para **uma**
tarefa e entrega em forma utilizável. A implementação acontece depois, na
sessão normal — aqui nada é escrito.

## 0. Carregue a gramática e localize a tarefa

Leia `$DOCS_KIT/grammar/GRAMATICA.md`. Ausente: **pare** e diga
que a instalação está incompleta; restaure a gramática no diretório da skill.

Encontre a tarefa no PLAN.md pelo id. Se o contexto da solicitação não trouxer um id:

- havendo uma fase corrente com tarefas abertas, liste as tarefas `[ ]` dela em
  uma linha cada e pergunte qual;
- não havendo PLAN, diga isso e ofereça montar o briefing a partir de uma
  descrição livre do usuário, avisando que sem PLAN não há rastreabilidade.

Se o id não existir, não invente: diga que não existe e liste os ids próximos.

## 1. Reúna o contrato

Leia, nesta ordem, e recolha só o que **esta** tarefa precisa:

1. **AGENTS.md** — a regra de ouro; a seção da área do módulo da tarefa; as
   convenções que se aplicam; as proibições de "Nunca fazer" que tocam este
   trabalho; os gaps conhecidos da área.
2. **PLAN.md** — a tarefa: módulo, testes ou verificação que a definem,
   critérios de aceitação, e a fase a que pertence. Também as tarefas de que
   ela depende e o estado delas.
3. **SPEC.md** — as constraints técnicas que a tarefa toca e os critérios de
   aceitação que ela ajuda a cumprir. Se a tarefa implementa algo que está na
   seção "Planejado", **diga isso em destaque**: o SPEC ainda descreve como
   futuro, e a rodada seguinte terá que mover.
4. **DOMAIN.md**, quando existir — os invariantes `I<n>` que a tarefa não pode
   violar e os termos do glossário que ela manipula.
5. **docs/<tema>.md** apontado pela área, quando houver.
6. **O código do módulo** — 2 a 4 arquivos, para saber o que já existe, qual o
   padrão local e onde a mudança encaixa. Nomeie os arquivos que leu.

## 2. Entregue o briefing

Uma mensagem, nesta forma:

**`<id> — <título da tarefa>`** · módulo `<módulo>` · fase `<fase>`

- **O que fazer** — a tarefa em duas ou três frases, no imperativo, com o
  escopo fechado. Diga também o que está **fora** dela e pertence a outra
  tarefa: é onde a implementação costuma vazar.
- **Onde** — os arquivos que provavelmente mudam, com o papel de cada um, e
  onde o padrão do módulo já resolve algo parecido (cite o arquivo e o que
  imitar).
- **Contrato vigente** — a regra de ouro em uma linha e as convenções que se
  aplicam aqui, cada uma com a justificativa. Só as que tocam esta tarefa;
  despejar o AGENTS.md inteiro não é briefing.
- **Não pode** — as proibições relevantes de "Nunca fazer" e os invariantes de
  domínio (`I<n>`) que a tarefa precisa preservar, cada um com a consequência
  de violar.
- **O que prova** — os testes ou a verificação que definem a tarefa, e os
  critérios de aceitação (do PLAN e os do SPEC que ela atende), escritos de
  modo que dê para dizer "passou" sem perguntar a ninguém (regra 5). Se a
  disciplina do projeto for TDD, diga explicitamente que os testes vêm antes.
- **Dependências e riscos** — tarefa anterior não fechada; gap conhecido da
  área que vai atrapalhar; risco do PLAN que aponta esta fase; decisão em
  aberto que trava a tarefa. **Decisão pendente que a bloqueia é motivo para
  parar**: nomeie e sugira `docs decidir` antes de implementar.
- **Buracos** — o que o doc-set não responde e a implementação vai precisar
  decidir. Cada um vira candidato a `docs decidir` durante o trabalho, não
  suposição silenciosa.

## 3. Nunca

- Escrever ou alterar código. Este comando prepara; a sessão implementa.
- Escrever ou alterar documento. Convenção nova descoberta aqui vira sugestão
  de `docs decidir`, não edição.
- Inventar critério de aceitação que o doc-set não tem. Faltando, o briefing
  diz que falta e propõe a formulação para o usuário aprovar.
- Ampliar o escopo da tarefa. Trabalho vizinho que você enxergar entra em
  "Buracos" ou vira tarefa nova sugerida para o PLAN — nunca entra caladamente
  no briefing.

## 4. Feche

Uma linha final com o encaminhamento: "Implemente na sessão; ao fechar o marco,
`docs rodada <nome>` sincroniza os documentos. Convenção decidida no caminho:
`docs decidir`."
