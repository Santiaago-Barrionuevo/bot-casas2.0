/** Constantes del dominio compartidas por validación y estrategia. */

export const BOARD_SIZE = 10;
export const DADO_MIN = 1;
export const DADO_MAX = 3;
export const JUGADORES = Object.freeze(["A", "B"]);

export const CELDA_VACIA = "";
export const CASA_NEUTRAL = "N";

/**
 * Direcciones en orden de prioridad. El orden es contrato: ante empate de
 * distancia gana la primera (N > S > E > O).
 * df/dc = desplazamiento unitario en fila/columna.
 */
export const DIRECCIONES = Object.freeze([
  Object.freeze({ nombre: "N", df: -1, dc: 0 }),
  Object.freeze({ nombre: "S", df: 1, dc: 0 }),
  Object.freeze({ nombre: "E", df: 0, dc: 1 }),
  Object.freeze({ nombre: "O", df: 0, dc: -1 }),
]);
