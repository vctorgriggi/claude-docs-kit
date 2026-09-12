# <Projeto>

> <Uma a três linhas: o que o projeto é.>

Leia este arquivo no início de toda sessão — ele é o **contrato de como
escrevemos código aqui**, não documentação. Quando uma convenção for decidida
durante a implementação, registre-a aqui. Contexto detalhado mora em @SPEC.md
(o quê e por quê) e @PLAN.md (ordem de execução)<, e @DOMAIN.md (o vocabulário
e as leis do domínio), quando existir>.

<Se houver fases: "**Fase atual = <recorte>.** <O que não pertence a esta fase
e onde está descrito.>">

## Regra de ouro

**<A disciplina central, em uma frase.>** Tudo abaixo é desdobramento disso.

<Um parágrafo: o que ela implica na prática. O que sobe, o que desce, o que
nunca atravessa.>

## Stack

| Camada   | Tecnologia                   |
| -------- | ---------------------------- |
| <camada> | <tecnologia e versão mínima> |

## Estrutura

```
<árvore comentada: pastas com o papel de cada uma. Em monorepo, a tabela de
aliases entra aqui, com a lista de todos os lugares a atualizar ao criar um
alias novo.>
```

## Como rodar

```bash
<comandos reais: dev, build, test, lint>
```

## <Seções por área, uma por costura do projeto>

<Esta é a parte específica do projeto: uma seção por camada ou borda relevante
(camada de dados, API, auth, i18n, concorrência, integrações frágeis), cada uma
com o padrão adotado, as regras do que atravessa e do que nunca atravessa a
fronteira, e um snippet mínimo quando prosa não ensina. Derive as seções das
áreas reais identificadas, não de um sumário genérico. Seção que passar de
~meia página extrai para docs/<tema>.md, deixando um ponteiro de uma linha
(regra 11).>

## Convenções

- <Linguagem e tipos: ex. "interface para shapes; sem enum, usar uniões
  literais e mapas as const; named exports".>
- <Nomenclatura: casing por tipo de item; regra bilíngue, se houver.>
- <Erros: o padrão adotado (Result, notFound(), exceções e onde) e a fronteira
  que um erro nunca cruza.>
- <Comentários: explicam o porquê, não o quê; sem decoração; conhecimento caro
  e durável permanece detalhado.>
- <Testes: o que é unitário (roda sem tocar borda real) e o que é borda fina
  (smoke ou manual), e a regra que mantém a borda fina.>
- <Env e segredos: split client/server; onde cada segredo pode viver.>
- <Escolhas de ecossistema fixadas: qual das alternativas válidas da stack
  este projeto usa (estrutura de pastas, estado, roteamento, estilo de teste),
  com "(fonte: docs oficiais <stack> <versão>, <mês/ano>)" quando vier de
  pesquisa.>
- <Bordas e pesquisa — só quando o projeto tem bordas frágeis: "integração
  nova com serviço externo, lib fora da stack ou recurso de framework ainda
  não usado aqui → consultar a doc oficial atual antes de implementar e
  registrar a versão consultada".>

## Nunca fazer

- Nunca <proibição absoluta e específica> — <justificativa ou evidência na mesma linha>.
<Uma proibição relevante basta; omita a seção quando não houver nenhuma.>

## Gaps conhecidos

<Só quando existem dívidas deliberadas confirmadas; não invente gaps para
justificar a seção. Cada entrada no presente: o que falta, por que foi
aceito, e onde vive o paliativo. A entrada sai quando o código a sanar.>

1. **G1 — <o que falta>** — <por que foi aceito>; paliativo: <onde ele vive>.
   <Quando revisitar.>

## Decisões em aberto

- [ ] **<decisão>** — <contexto>.

<Resolvida, a linha sai e o que ela produziu entra em Convenções, em Nunca
fazer ou em Gaps conhecidos (regra 7). Quando não sobra nenhuma pendência, a
seção declara "Nenhuma pendente." — seção vazia e seção ausente têm
significados diferentes (regra 6).>
