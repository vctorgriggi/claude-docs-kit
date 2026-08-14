// Aritmética de dinheiro em centavos inteiros. Core puro.
// Nenhum valor monetário trafega como float (DOMAIN.md, I3).

/**
 * Soma os itens e aplica o desconto proporcional, arredondando meio-para-cima
 * uma única vez, no fim (DOMAIN.md › Regras de cálculo).
 * @param {{centavos: number, quantidade: number}[]} itens
 * @param {number} descontoBps desconto em pontos-base (100 bps = 1%)
 */
export function total(itens, descontoBps = 0) {
  if (!Number.isInteger(descontoBps) || descontoBps < 0 || descontoBps > 10000) {
    throw new Error(`desconto fora da faixa: ${descontoBps}`);
  }
  const bruto = itens.reduce((soma, i) => {
    if (!Number.isInteger(i.centavos)) {
      throw new Error(`valor não inteiro em centavos: ${i.centavos}`);
    }
    return soma + i.centavos * i.quantidade;
  }, 0);
  return Math.floor((bruto * (10000 - descontoBps)) / 10000 + 0.5);
}
