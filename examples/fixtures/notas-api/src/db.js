let seq = 0;
const notas = new Map();

export const db = {
  listar: () => [...notas.values()],
  buscar: (id) => notas.get(Number(id)),
  criar(texto) {
    const nota = { id: ++seq, texto };
    notas.set(nota.id, nota);
    return nota;
  },
  remover: (id) => notas.delete(Number(id)),
};
