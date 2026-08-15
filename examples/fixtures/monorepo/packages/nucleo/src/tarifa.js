// Faixas como dado, não como código: faixa nova é uma linha aqui, e nunca um
// `if` novo em calcular(). Valores em centavos por kWh.
const FAIXAS = [
  { ateKwh: 100, centavosPorKwh: 62 },
  { ateKwh: Infinity, centavosPorKwh: 89 },
];

// Sem argv, sem console, sem data do sistema: tudo que varia entra por
// parâmetro (regra de ouro deste pacote).
export function calcular(kwh) {
  if (!Number.isInteger(kwh) || kwh < 0) {
    throw new Error(`consumo precisa ser inteiro não negativo em kWh: ${kwh}`);
  }
  let restante = kwh;
  let anterior = 0;
  let centavos = 0;
  for (const faixa of FAIXAS) {
    if (restante === 0) break;
    const nesta = Math.min(restante, faixa.ateKwh - anterior);
    centavos += nesta * faixa.centavosPorKwh;
    restante -= nesta;
    anterior = faixa.ateKwh;
  }
  return centavos;
}
