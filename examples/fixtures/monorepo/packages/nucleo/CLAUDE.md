# @tarifa/nucleo

> Recipe local: só o que difere do contrato raiz. O que vale para os dois
> pacotes está em ../../CLAUDE.md e não é repetido aqui.

## Regra de ouro

**Nada aqui sabe que existe um usuário.** Sem argv, sem `console`, sem
`process.exit`, sem data do sistema — tudo que varia entra por parâmetro. É o
que permite testar cada faixa sem subprocess e o que mantém o pacote
consumível por um serviço que não é a CLI.

## Convenções locais

- A tabela de faixas é dado, não código: uma estrutura no topo do módulo, para
  que faixa nova seja uma linha e não um `if`.
- Erro de entrada é `Error` com mensagem legível; quem decide exit code é a
  borda.
