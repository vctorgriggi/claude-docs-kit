import { Router } from 'express';
import { db } from '../db.js';

export const rotasNotas = Router();

rotasNotas.use((req, res, next) => {
  if (req.get('authorization') !== `Bearer ${process.env.API_TOKEN}`) {
    return res.status(401).json({ ok: false, erro: 'nao autorizado' });
  }
  next();
});

rotasNotas.get('/', (req, res) => {
  res.json({ ok: true, dados: db.listar() });
});

rotasNotas.post('/', (req, res) => {
  if (!req.body?.texto) {
    return res.status(400).json({ ok: false, erro: 'texto obrigatorio' });
  }
  res.status(201).json({ ok: true, dados: db.criar(req.body.texto) });
});
