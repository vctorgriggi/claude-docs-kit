import express from "express";
import { rotasNotas } from "./routes/notes.js";
import { rotasAdmin } from "./routes/admin.js";

const app = express();
app.use(express.json());
app.use("/notas", rotasNotas);
app.use("/admin", rotasAdmin);
app.listen(process.env.PORT ?? 3000);
