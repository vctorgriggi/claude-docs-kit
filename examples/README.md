# Exemplos

> Transcrições de sessão dos comandos do kit, anotadas, e os doc-sets de
> referência sobre os quais elas rodam. Convenção: blockquotes em itálico são
> anotações do corpus; todo o resto é a sessão. As sessões rodam sobre os
> fixtures desta pasta, em contexto limpo — reproduzíveis por terceiros, sem
> depender de memória de conta.

## Transcrições

**Comece por [ciclo-completo.md](ciclo-completo.md)** se quiser ver o uso
inteiro antes do detalhe: uma semana no linkcheck, do hook na segunda à rodada
na sexta, incluindo o que não é comando (verificador no terminal, panorama
entre projetos, CI). É o mapa; as transcrições abaixo são os mergulhos.

Uma transcrição por comando do ciclo, na ordem em que eles aparecem na vida de
um projeto:

| Arquivo | Comando | O que observar |
| --- | --- | --- |
| [01-modo-a-cli-nova.md](01-modo-a-cli-nova.md) | `/docs:fundar novo` | os 4 blocos com sondagem anti-satisficing e wildcard; ledger e prontidão; a Proposta recusando ROADMAP e "Nunca fazer" e pulando a pesquisa de stack com anúncio (escala honesta); o gate; checagens de entrega |
| [02-modo-b-varredura.md](02-modo-b-varredura.md) | `/docs:fundar existente` | o relatório em três listas; gap virando pergunta e depois inventário; fonte contra fonte; degradação sem git; as 3 rotas para documentação existente; o PLAN nascendo sem passado |
| [03-tarefa-e-decidir.md](03-tarefa-e-decidir.md) | `/docs:tarefa` · `/docs:decidir` | o briefing trazendo só o que a tarefa precisa; a tarefa **travada** por decisão em aberto; a classificação da decisão pela jurisdição; a linha pendente saindo e a exclusão de escopo entrando no lugar |
| [04-auditar.md](04-auditar.md) | `/docs:auditar` | as duas camadas num relatório só; a regra de ouro desmentida pelo próprio core; o que o comando devolve ao usuário em vez de inferir; `git status` limpo no fim |
| [05-rodada.md](05-rodada.md) | `/docs:rodada` | a tabela de conversão ("isto muda como um agente age?"); fases concluídas **saindo** do PLAN; decisão resolvida virando convenção em vez de `[x]`; o resumo como lugar da história; diff mínimo; marcador no fecho |
| [regressao-da-gramatica.md](regressao-da-gramatica.md) | (mantenedor) | 54 casos com resultado travado, agrupados por comando e por ferramenta, para detectar deriva depois de editar a gramática ou o verificador |

A numeração é a ordem de leitura, e ela é o ciclo: funda-se o doc-set (01 ou
02), ele destrava a implementação (03), a implementação abre drift (04), e a
rodada fecha o marco (05).

Dois pares valem mais que os arquivos isolados:

- **01 → 05** prova a durabilidade: compare o doc-set gerado na fundação com o
  estado após a rodada. O PLAN termina **menor** do que começou, com mais
  trabalho descrito à frente.
- **03 → 04** mostra as duas direções no mesmo dia: o doc-set destravando a
  implementação, e a implementação abrindo drift que a auditoria encontra.

## Doc-sets de referência

Os três passam `docscheck --strict` com **zero achados** no CI. É a única forma
honesta de manter um exemplo confiável: se a gramática mudar e o exemplo não
acompanhar, o build quebra.

| Fixture | Para que serve |
| --- | --- |
| [`fixtures/linkcheck/`](fixtures/linkcheck/) | A gramática no caso simples — core puro, borda fina, uma fase viva e uma decisão em aberto. É a CLI dos exemplos 1 e 3, e a referência do SPEC/PLAN/CLAUDE. |
| [`fixtures/pedidos/`](fixtures/pedidos/) | A referência do `DOMAIN.md` — glossário que define termos sem invadir o SPEC, invariantes `I<n>` rastreados até o nome dos testes, máquina de estados e regras de cálculo com exemplo numérico. |
| [`fixtures/monorepo/`](fixtures/monorepo/) | O caso de vários pacotes — `A8` (cada `packages/*/CLAUDE.md` com regra de ouro própria, sem copiar o raiz) e `A7` (satélite em `docs/` com ponteiro de ida no contrato e de volta no índice). É o único fixture com workspaces, e o `npm install` dele só linka os pacotes: nada externo entra. |
| [`fixtures/notas-api/`](fixtures/notas-api/) | Repositório **sem** doc-set, de convenções mistas: é a entrada do exemplo 2 e do smoke de regressão. Não tem SPEC/PLAN/CLAUDE de propósito — é o que o Modo B encontra no mundo real. |

Rodando os fixtures direto:

```bash
node bin/docscheck.mjs --strict examples/fixtures/linkcheck
node bin/docscheck.mjs --strict examples/fixtures/pedidos
node bin/docscheck.mjs --strict examples/fixtures/monorepo
node bin/docscheck.mjs --explain H2      # o porquê de uma regra e seus exemplos

cd examples/fixtures/pedidos && node --test   # os testes nomeiam os invariantes
```
