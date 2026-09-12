# pedidos

> Biblioteca Node sem dependências com o ciclo de vida e a aritmética de um
> pedido.

Leia este arquivo no início de toda sessão — ele é o **contrato de como
escrevemos código aqui**, não documentação. Quando uma convenção for decidida
durante a implementação, registre-a aqui. Contexto detalhado mora em SPEC.md
(o quê e por quê), PLAN.md (ordem de execução) e DOMAIN.md (o vocabulário e
as leis do domínio).

**Fase atual = reembolso parcial.** O histórico de transições é fase posterior
e não deve ser antecipado.

## Regra de ouro

**Nenhuma regra de domínio existe fora de `src/`: quem chama a biblioteca
decide quando, nunca se pode.** Tudo abaixo é desdobramento disso. Uma
condição de negócio replicada no chamador é a origem da divergência que esta
biblioteca existe para eliminar; se falta um caso, ele entra aqui.

## Stack

| Camada  | Tecnologia     |
| ------- | -------------- |
| Runtime | Node ≥ 20, ESM |
| Testes  | node:test      |

## Estrutura

```
src/
  estados.js   # tabela de transições e consultas sobre ela
  total.js     # aritmética de centavos e desconto
test/
  estados.test.js
```

## Como rodar

```bash
npm test
```

## Domínio

As leis vivem em DOMAIN.md, com id. Aqui vale a disciplina de mantê-las
executáveis:

- Toda transição nova entra primeiro na tabela de `src/estados.js`; a tabela é
  a única fonte, e o DOMAIN a descreve.
- Todo invariante `I<n>` tem pelo menos um teste que o nomeia no título —
  é assim que se descobre que uma mudança o quebrou, e não pela revisão.
- Invariante novo entra no DOMAIN antes do código que o sustenta (a ordem
  importa: código primeiro produz lei retroajustada ao que foi implementado).

## Convenções

- Módulos puros: `estados.js` e `total.js` não fazem I/O, não leem relógio e
  não imprimem (mantém cada invariante testável sem infraestrutura).
- Erro em vez de valor inválido: `transicionar` lança em vez de devolver o
  estado antigo; devolver silenciosamente faria o chamador tratar recusa como
  sucesso.
- Dinheiro em centavos inteiros, sempre; "reais" é formatação da borda.
- Arredondamento uma vez, no fim do cálculo (por item, o erro acumula e não
  fecha com o extrato).
- Desconto em pontos-base inteiros, nunca em percentual float.

## Nunca fazer

- Nunca replicar condição de transição no chamador — é exatamente a divergência
  que a biblioteca existe para eliminar (regra de ouro).
- Nunca usar float para dinheiro — 0.1 + 0.2 não fecha caixa (I3).
- Nunca devolver estado inválido em vez de lançar — o chamador trata retorno
  como sucesso e persiste a inconsistência.
- Nunca adicionar dependência de runtime — a biblioteca é embutida em serviços
  que não controlam o próprio lockfile (SPEC, constraint 1).
- Nunca dar saída a um estado terminal sem antes mudar o invariante no DOMAIN
  — o código passaria a contradizer a lei declarada (I2).

## Decisões em aberto

Nenhuma pendente.
