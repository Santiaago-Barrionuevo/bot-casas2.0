import { chooseMove } from "./strategy.js";
import { isState } from "./state.js";

// Conecta HTTP con la estrategia del juego.
export function move(req, res) {
  const state = req.body;

  // Un JSON válido puede tener una estructura incorrecta para nuestro juego.
  if (!isState(state)) {
    return res.status(400).json({
      error: 'Estado inválido: se requiere jugador A o B, dado de 1 a 3 y tablero de 10x10 con "", "N" o piezas como A1/B1.',
    });
  }

  // res.json envía el resultado con código HTTP 200 por defecto.
  return res.json(chooseMove(state));
}
