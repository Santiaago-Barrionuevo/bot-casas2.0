import { CASA_NEUTRAL, BOARD_SIZE, DADO_MAX, DADO_MIN, DIRECCIONES } from "./constants.js";
import { TOTAL_CELDAS, calcularDestino, indiceDe } from "./geometria.js";

const TOLERANCIA = 1e-12;
const MAX_ITERACIONES = 2000;
const PRECISION = 1e6; // se redondea para que los empates reales sean exactos

/**
 * Turnos esperados para conquistar una casa desde cada casilla.
 *
 * Una casa solo se conquista terminando EXACTAMENTE sobre ella (regla 8), y el
 * dado (1-3, uniforme) se conoce recién al empezar el turno. La distancia
 * Manhattan ignora eso: una ficha a distancia 1 con un dado de 3 no puede
 * conquistar. Por eso se resuelve el proceso de decisión de Markov:
 *
 *   T(casa) = 0
 *   T(x)    = promedio sobre d∈{1,2,3} de [ 1 + min_dir T(x + dir·d) ]
 *
 * mediante iteración de valor (Jacobi: preserva la simetría del tablero).
 * Converge porque desde cualquier casilla hay probabilidad positiva de llegar.
 *
 * Complejidad: O(K · R·C · |dados| · |dirs|), con K iteraciones (~decenas).
 *
 * @param {string[][]} tablero
 * @returns {{turnos: Float64Array, esCasa: Uint8Array}}
 *   `turnos` es 0 en todo el tablero si no hay casas (no hay nada que preferir).
 */
export function turnosEsperados(tablero) {
  const esCasa = new Uint8Array(TOTAL_CELDAS);
  let hayCasas = false;
  for (let f = 0; f < BOARD_SIZE; f++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tablero[f][c] === CASA_NEUTRAL) {
        esCasa[indiceDe(f, c)] = 1;
        hayCasas = true;
      }
    }
  }
  if (!hayCasas) return { turnos: new Float64Array(TOTAL_CELDAS), esCasa };

  // vecinos[x][k] = casillas alcanzables desde x con el dado (DADO_MIN + k).
  const dados = Array.from({ length: DADO_MAX - DADO_MIN + 1 }, (_, k) => DADO_MIN + k);
  const alcanzables = Array.from({ length: TOTAL_CELDAS }, (_, x) => {
    const fila = Math.floor(x / BOARD_SIZE);
    const columna = x % BOARD_SIZE;
    return dados.map((d) =>
      DIRECCIONES.map((dir) => indiceDe(...calcularDestino(fila, columna, dir, d))),
    );
  });

  let actual = new Float64Array(TOTAL_CELDAS);
  let siguiente = new Float64Array(TOTAL_CELDAS);

  for (let it = 0; it < MAX_ITERACIONES; it++) {
    let cambioMaximo = 0;
    for (let x = 0; x < TOTAL_CELDAS; x++) {
      if (esCasa[x]) continue; // valor terminal 0
      let suma = 0;
      for (const destinos of alcanzables[x]) {
        let mejor = Infinity;
        for (const y of destinos) if (actual[y] < mejor) mejor = actual[y];
        suma += 1 + mejor;
      }
      const valor = suma / dados.length;
      siguiente[x] = valor;
      cambioMaximo = Math.max(cambioMaximo, Math.abs(valor - actual[x]));
    }
    [actual, siguiente] = [siguiente, actual];
    if (cambioMaximo < TOLERANCIA) break;
  }

  for (let x = 0; x < TOTAL_CELDAS; x++) {
    actual[x] = Math.round(actual[x] * PRECISION) / PRECISION;
  }
  return { turnos: actual, esCasa };
}
