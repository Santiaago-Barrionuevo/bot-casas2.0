import { BOARD_SIZE, CELDA_VACIA, CASA_NEUTRAL, DIRECCIONES } from "./constants.js";
import { calcularDestino, indiceDe } from "./geometria.js";
import { turnosEsperados } from "./valuacion.js";
import { asignacionMinima } from "./asignacion.js";

/** Conquistar vale una ficha nueva y cuenta para el desempate: se premia fuerte. */
const BONO_CONQUISTA = 10;
/** Costo de una jugada ilegal (casilla rival). Muy superior a cualquier valor real. */
const COSTO_ILEGAL = 1e6;
/** Desempate determinista por orden de DIRECCIONES (N > S > E > O); < PRECISION de valuación. */
const EPSILON_DIRECCION = 1e-7;

/** Fichas propias y casillas ocupadas por el rival, en orden de lectura del tablero. */
function leerFichas(tablero, jugador) {
  const propias = [];
  const ocupadasPorRival = new Set();
  for (let fila = 0; fila < BOARD_SIZE; fila++) {
    for (let columna = 0; columna < BOARD_SIZE; columna++) {
      const celda = tablero[fila][columna];
      if (celda === CELDA_VACIA || celda === CASA_NEUTRAL) continue;
      if (celda[0] === jugador) propias.push({ id: celda, fila, columna });
      else ocupadasPorRival.add(indiceDe(fila, columna));
    }
  }
  return { propias, ocupadasPorRival };
}

/**
 * Para una ficha: mapa casilla-destino -> {direccion, costo}. Si dos direcciones
 * cayeran en la misma casilla se conserva la de menor costo.
 */
function opcionesDe(ficha, dado, { turnos, esCasa }, ocupadasPorRival) {
  const opciones = new Map();
  DIRECCIONES.forEach((direccion, k) => {
    const destino = indiceDe(...calcularDestino(ficha.fila, ficha.columna, direccion, dado));
    // Regla 7: nunca se puede terminar sobre una ficha (el rival no se mueve en mi turno).
    const costo = ocupadasPorRival.has(destino)
      ? COSTO_ILEGAL
      : (esCasa[destino] ? -BONO_CONQUISTA : turnos[destino]) + k * EPSILON_DIRECCION;
    const previa = opciones.get(destino);
    if (!previa || costo < previa.costo) opciones.set(destino, { direccion: direccion.nombre, costo });
  });
  return opciones;
}

/**
 * Decide el movimiento de TODAS las fichas del jugador como una única jugada.
 *
 * Las reglas 7 y 10 hacen que la jugada sea inválida si dos fichas terminan en la
 * misma casilla (o una cae sobre una ficha rival), y tres jugadas inválidas seguidas
 * son derrota técnica. Elegir ficha por ficha no garantiza validez, así que se
 * resuelve un problema de asignación: cada ficha recibe una casilla destino
 * distinta, minimizando la suma de "turnos esperados para conquistar", con un
 * bono por conquistar. Dos fichas nunca compiten por la misma casa.
 *
 * Complejidad (P fichas): O(R·C·K) para la valuación + O(P³) para la asignación.
 * Función pura: no muta `state`.
 *
 * @param {{jugador: string, dado: number, tablero: string[][]}} state Ya validado.
 * @returns {Record<string, string>} ficha -> "N" | "S" | "E" | "O".
 */
export function chooseMove({ jugador, dado, tablero }) {
  const { propias, ocupadasPorRival } = leerFichas(tablero, jugador);
  if (propias.length === 0) return {};

  const valuacion = turnosEsperados(tablero);
  const opciones = propias.map((f) => opcionesDe(f, dado, valuacion, ocupadasPorRival));

  // Columnas = casillas destino distintas (rellenadas hasta >= filas).
  const columnas = [...new Set(opciones.flatMap((o) => [...o.keys()]))];
  const ancho = Math.max(columnas.length, propias.length);
  const indiceColumna = new Map(columnas.map((c, j) => [c, j]));

  const costo = opciones.map((o) => {
    const fila = new Array(ancho).fill(COSTO_ILEGAL);
    for (const [destino, { costo: c }] of o) fila[indiceColumna.get(destino)] = c;
    return fila;
  });

  const asignadas = asignacionMinima(costo);
  const movimientos = {};
  propias.forEach((ficha, i) => {
    const elegida = opciones[i].get(columnas[asignadas[i]]);
    // Sin jugada completamente válida posible, se degrada a la mejor opción individual.
    const { direccion } = elegida ?? [...opciones[i].values()].sort((a, b) => a.costo - b.costo)[0];
    movimientos[ficha.id] = direccion;
  });
  return movimientos;
}
