// Máquina de estados de pedido. Core puro: sem I/O, sem relógio, sem log.
// As transições declaradas aqui são as únicas que existem — o que não está
// na tabela não acontece (DOMAIN.md, I1 e I2).

/** @typedef {"rascunho"|"aguardando_pagamento"|"pago"|"enviado"|"cancelado"} Estado */

const TRANSICOES = {
  rascunho: ["aguardando_pagamento", "cancelado"],
  aguardando_pagamento: ["pago", "cancelado"],
  pago: ["enviado", "cancelado"],
  enviado: [],
  cancelado: [],
};

export const ESTADOS = Object.keys(TRANSICOES);

export function permitida(de, para) {
  return (TRANSICOES[de] ?? []).includes(para);
}

/**
 * Aplica uma transição. Devolve o estado novo ou lança — nunca devolve um
 * estado inválido em silêncio, porque o chamador trataria como sucesso.
 */
export function transicionar(de, para) {
  if (!(de in TRANSICOES)) throw new Error(`estado desconhecido: ${de}`);
  if (!permitida(de, para)) {
    throw new Error(`transição proibida: ${de} → ${para}`);
  }
  return para;
}

/** Um pedido em estado terminal não muda mais (I2). */
export function terminal(estado) {
  return TRANSICOES[estado]?.length === 0;
}
