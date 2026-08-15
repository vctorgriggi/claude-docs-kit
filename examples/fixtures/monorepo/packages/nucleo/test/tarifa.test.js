import { test } from "node:test";
import assert from "node:assert/strict";
import { calcular } from "../src/tarifa.js";

test("critério 1: consumo dentro da faixa baixa", () => {
  assert.equal(calcular(80), 4960);
});

test("critério 2: consumo nas duas faixas, sem arredondamento intermediário", () => {
  assert.equal(calcular(250), 100 * 62 + 150 * 89);
});

test("critério 3: consumo fracionário é recusado", () => {
  assert.throws(() => calcular(80.5), /inteiro não negativo/);
});
