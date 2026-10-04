import { app } from "./app.js";

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Bot de casas escuchando en http://localhost:${port}`);
});

// Cierre ordenado: deja terminar las solicitudes en curso antes de salir.
const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
