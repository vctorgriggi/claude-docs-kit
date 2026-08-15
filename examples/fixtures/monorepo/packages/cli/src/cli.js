#!/usr/bin/env node
// Traduz e não decide: argv vira parâmetro, centavo vira texto. Nenhuma
// ramificação por faixa mora aqui (regra de ouro deste pacote).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { calcular } from "@tarifa/nucleo";

export const formatar = (centavos) =>
  `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;

export function main(argv) {
  const kwh = Number(argv[0]);
  try {
    console.log(formatar(calcular(kwh)));
    return 0;
  } catch (e) {
    console.error(`erro: ${e.message}`);
    return 2;
  }
}

// Por realpath e não por string de URL: em macOS `/tmp` e `/var` são symlinks,
// e comparar o caminho cru faz o guard falhar em silêncio. Sem o guard, um
// `import` deste módulo — o teste, por exemplo — roda a CLI e encerra o
// processo.
const ehEntryPoint = () => {
  try {
    return (
      process.argv[1] &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
};

if (ehEntryPoint()) process.exit(main(process.argv.slice(2)));
