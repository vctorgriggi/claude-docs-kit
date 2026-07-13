import { Router } from 'express';
import { db } from '../db.js';

export const rotasAdmin = Router();

rotasAdmin.delete('/notas/:id', (req, res) => {
  const nota = db.buscar(req.params.id);
  if (!nota) throw new Error(`nota ${req.params.id} nao existe`);
  db.remover(req.params.id);
  res.status(204).end();
});

rotasAdmin.get('/dump', (req, res) => {
  res.json(db.listar());
});
