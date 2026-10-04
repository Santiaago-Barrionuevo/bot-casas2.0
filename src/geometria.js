import { BOARD_SIZE } from "./constants.js";

export const TOTAL_CELDAS = BOARD_SIZE * BOARD_SIZE;

/** Normaliza un índice al rango [0, BOARD_SIZE) con topología toroidal. */
export const envolver = (n) => ((n % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;

export const indiceDe = (fila, columna) => fila * BOARD_SIZE + columna;

/**
 * Casilla final tras avanzar exactamente `dado` casillas en una dirección.
 * @returns {[number, number]} [fila, columna]
 */
export function calcularDestino(fila, columna, { df, dc }, dado) {
  return [envolver(fila + df * dado), envolver(columna + dc * dado)];
}
