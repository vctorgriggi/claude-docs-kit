import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { extrairLinks, slug, verificar } from '../src/check.js';

test('extrai links com linha e ignora blocos de código', () => {
  const md = '[a](x.md)\n```\n[b](y.md)\n```\n[c](z.md#h)';
  assert.deepEqual(extrairLinks(md), [
    { alvo: 'x.md', linha: 1 },
    { alvo: 'z.md#h', linha: 5 },
  ]);
});

test('slug normaliza acentos e espaços', () => {
  assert.equal(slug('Configuração'), 'configuracao');
  assert.equal(slug('Como rodar'), 'como-rodar');
});

test('arquivo inexistente é reportado; âncora acentuada válida não é', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'linkcheck-'));
  await writeFile(path.join(dir, 'b.md'), '## Configuração\n');
  await writeFile(
    path.join(dir, 'a.md'),
    '[ok](b.md#configuracao)\n[quebrado](c.md)\n'
  );
  const quebrados = await verificar(dir);
  assert.equal(quebrados.length, 1);
  assert.equal(quebrados[0].alvo, 'c.md');
  assert.equal(quebrados[0].linha, 2);
});
