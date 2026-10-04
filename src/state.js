import {
  BOARD_SIZE,
  CASA_NEUTRAL,
  CELDA_VACIA,
  DADO_MAX,
  DADO_MIN,
  JUGADORES,
} from "./constants.js";

/** Ficha: jugador + identificador numérico sin ceros a la izquierda (A1, B12). */
const FICHA = /^[AB][1-9]\d*$/;

const esCeldaValida = (celda) =>
  typeof celda === "string" &&
  (celda === CELDA_VACIA || celda === CASA_NEUTRAL || FICHA.test(celda));

const esFilaValida = (fila) =>
  Array.isArray(fila) && fila.length === BOARD_SIZE && fila.every(esCeldaValida);

const esTableroValido = (tablero) =>
  Array.isArray(tablero) &&
  tablero.length === BOARD_SIZE &&
  tablero.every(esFilaValida);

/** Las fichas son únicas: un id repetido haría que una ficha pise a otra en la respuesta. */
const fichasSinDuplicados = (tablero) => {
  const vistas = new Set();
  for (const fila of tablero) {
    for (const celda of fila) {
      if (!FICHA.test(celda)) continue;
      if (vistas.has(celda)) return false;
      vistas.add(celda);
    }
  }
  return true;
};

/**
 * Type guard del estado de juego recibido por HTTP.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isState(value) {
  if (typeof value !== "object" || value === null) return false;

  return (
    JUGADORES.includes(value.jugador) &&
    Number.isInteger(value.dado) && // typeof number implícito; rechaza "3" y 1.5
    value.dado >= DADO_MIN &&
    value.dado <= DADO_MAX &&
    esTableroValido(value.tablero) &&
    fichasSinDuplicados(value.tablero)
  );
}
