import express from "express";
import { move } from "./move.js";

// Un estado válido pesa < 1 KB; 16 KB deja margen y limita abuso de memoria.
const BODY_LIMIT = "16kb";

// Se crea sin abrir un puerto: reutilizable en tests y en server.js.
export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: BODY_LIMIT }));
app.post("/move", move);

// Rutas inexistentes responden JSON (y no el HTML por defecto de Express).
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

// Express identifica el manejador de errores por su aridad (4 parámetros).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El body contiene JSON inválido." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "El body supera el tamaño permitido." });
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error(err); // el cliente nunca ve el detalle

  return res.status(status).json({
    error: status >= 500 ? "Error interno del bot." : "Solicitud inválida.",
  });
};

app.use(errorHandler);
