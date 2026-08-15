import { test } from "node:test";
import assert from "node:assert/strict";
import { formatar } from "../src/cli.js";

test("centavos inteiros viram moeda com vírgula", () => {
  assert.equal(formatar(4960), "R$ 49,60");
});
