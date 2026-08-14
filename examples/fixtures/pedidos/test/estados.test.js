import { test } from "node:test";
import assert from "node:assert/strict";
import { ESTADOS, permitida, terminal, transicionar } from "../src/estados.js";
import { total } from "../src/total.js";

// Cada teste abaixo prova um invariante do DOMAIN.md pelo id.

test("I1 — pedido cancelado nunca volta a pago", () => {
  assert.equal(permitida("cancelado", "pago"), false);
  assert.throws(() => transicionar("cancelado", "pago"), /transição proibida/);
});

test("I2 — estado terminal não tem saída", () => {
  assert.ok(terminal("cancelado"));
  assert.ok(terminal("enviado"));
  for (const destino of ESTADOS) {
    assert.equal(permitida("enviado", destino), false);
  }
});

test("I3 — dinheiro só trafega em centavos inteiros", () => {
  assert.throws(() => total([{ centavos: 10.5, quantidade: 1 }]), /não inteiro/);
  assert.equal(total([{ centavos: 1000, quantidade: 3 }]), 3000);
});

test("arredondamento acontece uma vez, no fim", () => {
  // 3 × 333 = 999; 999 com 10% de desconto = 899,1 → 899
  assert.equal(total([{ centavos: 333, quantidade: 3 }], 1000), 899);
});

test("desconto fora da faixa é recusado", () => {
  assert.throws(() => total([], 10001), /fora da faixa/);
});
