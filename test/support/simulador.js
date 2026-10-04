import { BOARD_SIZE, DIRECCIONES } from "../../src/constants.js";
import { envolver, calcularDestino } from "../../src/geometria.js";

/** Generador pseudoaleatorio reproducible (LCG). */
export function crearRng(semilla) {
  let s = semilla >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

const clave = (f, c) => `${f},${c}`;
const POR_NOMBRE = Object.fromEntries(DIRECCIONES.map((d) => [d.nombre, d]));
const INICIO = { A: [0, 0], B: [BOARD_SIZE - 1, BOARD_SIZE - 1] };
const MAX_TURNOS = 50;

/** Casilla libre adyacente determinista para una ficha nueva (regla 9). */
function casillaLibreCerca(f, c, ocupadas) {
  if (!ocupadas.has(clave(f, c))) return [f, c];
  for (const d of DIRECCIONES) {
    const g = [envolver(f + d.df), envolver(c + d.dc)];
    if (!ocupadas.has(clave(...g))) return g;
  }
  return [f, c];
}

/**
 * Motor mínimo de "Casas en disputa" según las reglas del enunciado.
 * `bots` = { A: chooseMove, B: chooseMove }. Devuelve el resultado de la partida.
 */
export function jugarPartida(bots, rng) {
  const fichas = { A: [{ id: "A1", pos: [...INICIO.A] }], B: [{ id: "B1", pos: [...INICIO.B] }] };
  const casas = new Set();
  const prohibidas = new Set([clave(...INICIO.A), clave(...INICIO.B)]);
  while (casas.size < 5) {
    const k = clave(Math.floor(rng() * BOARD_SIZE), Math.floor(rng() * BOARD_SIZE));
    if (!prohibidas.has(k)) casas.add(k);
  }
  const conquistadas = { A: 0, B: 0 };
  const proxId = { A: 2, B: 2 };
  const pendientes = { A: [], B: [] };
  const fallos = { A: 0, B: 0 };
  const invalidas = { A: 0, B: 0 };
  let derrotaTecnica = null;
  let turno = 0;

  for (; turno < MAX_TURNOS && casas.size > 0 && !derrotaTecnica; turno++) {
    const j = turno % 2 === 0 ? "A" : "B";
    const rival = j === "A" ? "B" : "A";

    // Fichas nuevas disponibles al comenzar el turno (regla 9).
    for (const [f, c] of pendientes[j].splice(0)) {
      const ocupadas = new Set([...fichas.A, ...fichas.B].map((x) => clave(...x.pos)));
      fichas[j].push({ id: `${j}${proxId[j]++}`, pos: casillaLibreCerca(f, c, ocupadas) });
    }

    const tablero = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(""));
    for (const k of casas) { const [f, c] = k.split(",").map(Number); tablero[f][c] = "N"; }
    for (const x of [...fichas.A, ...fichas.B]) tablero[x.pos[0]][x.pos[1]] = x.id;

    const dado = 1 + Math.floor(rng() * 3);
    let jugada;
    try { jugada = bots[j](structuredClone({ jugador: j, dado, tablero })); } catch { jugada = null; }

    // Validación (reglas 5, 7, 10).
    let valida = jugada && fichas[j].every((x) => POR_NOMBRE[jugada[x.id]]);
    const finales = [];
    if (valida) {
      const ocupadasRival = new Set(fichas[rival].map((x) => clave(...x.pos)));
      const vistos = new Set();
      for (const x of fichas[j]) {
        const dest = calcularDestino(x.pos[0], x.pos[1], POR_NOMBRE[jugada[x.id]], dado);
        const k = clave(...dest);
        if (vistos.has(k) || ocupadasRival.has(k)) { valida = false; break; }
        vistos.add(k);
        finales.push(dest);
      }
    }

    if (!valida) {
      invalidas[j]++;
      if (++fallos[j] >= 3) derrotaTecnica = j;
      continue; // las fichas no se mueven
    }
    fallos[j] = 0;
    fichas[j].forEach((x, i) => {
      x.pos = finales[i];
      const k = clave(...x.pos);
      if (casas.delete(k)) { conquistadas[j]++; pendientes[j].push(x.pos); }
    });
  }

  let ganador;
  if (derrotaTecnica) ganador = derrotaTecnica === "A" ? "B" : "A";
  else ganador = conquistadas.A === conquistadas.B ? "empate" : conquistadas.A > conquistadas.B ? "A" : "B";
  return { ganador, conquistadas, invalidas, derrotaTecnica, turnos: turno };
}
