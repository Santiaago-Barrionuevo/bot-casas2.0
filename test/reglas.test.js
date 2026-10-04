import { expect, test } from "@jest/globals";
import { isState } from "../src/state.js";
import { chooseMove } from "../src/strategy.js";
import { asignacionMinima } from "../src/asignacion.js";
import { turnosEsperados } from "../src/valuacion.js";
import { chooseMove as estrategiaOriginal } from "./support/estrategia_original.js";
import { crearRng, jugarPartida } from "./support/simulador.js";

const estado = (jugador, dado, celdas) => {
  const tablero = Array.from({ length: 10 }, () => Array(10).fill(""));
  for (const [f, c, v] of celdas) tablero[f][c] = v;
  return { jugador, dado, tablero };
};
const DIR = { N: [-1, 0], S: [1, 0], E: [0, 1], O: [0, -1] };
const destinoDe = ([f, c], dir, dado) => [
  (f + DIR[dir][0] * dado + 10) % 10, (c + DIR[dir][1] * dado + 10) % 10];

test("regla 10: dos fichas que quieren la misma casa no terminan juntas", () => {
  // Ambas llegan a la casa (5,5) con un 3: la versión ingenua las manda a las dos.
  const s = estado("A", 3, [[5, 2, "A1"], [5, 8, "A2"], [5, 5, "N"]]);
  const ingenua = estrategiaOriginal(s);
  expect(destinoDe([5, 2], ingenua.A1, 3)).toEqual(destinoDe([5, 8], ingenua.A2, 3)); // jugada inválida
  const m = chooseMove(s);
  expect(destinoDe([5, 2], m.A1, 3)).not.toEqual(destinoDe([5, 8], m.A2, 3));
  // Y una de las dos sí conquista.
  const finales = [destinoDe([5, 2], m.A1, 3), destinoDe([5, 8], m.A2, 3)];
  expect(finales).toContainEqual([5, 5]);
});

test("regla 7: no termina sobre una ficha rival aunque sea la casilla ideal", () => {
  // La casa está rodeada de la ficha rival en el único destino que conquistaría.
  const s = estado("A", 2, [[5, 3, "A1"], [5, 5, "B1"], [4, 5, "N"]]);
  const m = chooseMove(s);
  expect(destinoDe([5, 3], m.A1, 2)).not.toEqual([5, 5]);
});

test("una ficha puede terminar donde estaba otra propia que se va", () => {
  const s = estado("A", 1, [[5, 5, "A1"], [5, 6, "A2"], [5, 7, "N"]]);
  const m = chooseMove(s);
  const finales = [destinoDe([5, 5], m.A1, 1), destinoDe([5, 6], m.A2, 1)];
  expect(new Set(finales.map(String)).size).toBe(2);
});

test("la valuación prefiere casillas alineadas con la casa y alcanzables con un dado", () => {
  const { tablero } = estado("A", 1, [[0, 0, "N"]]);
  const { turnos } = turnosEsperados(tablero);
  expect(turnos[0 * 10 + 3]).toBeCloseTo(3, 5); // alineada a 3: hace falta sacar un 3
  expect(turnos[0 * 10 + 3]).toBeLessThan(turnos[1 * 10 + 1]); // en diagonal exige dos tiros exactos
});

test("asignacionMinima encuentra el óptimo global y admite costos negativos", () => {
  expect(asignacionMinima([[4, 1, 3], [2, 0, 5], [3, 2, 2]])).toEqual([1, 0, 2]);
  expect(asignacionMinima([[-10, 0], [-10, 1]])).toEqual([1, 0]); // -10+0 = -10 es mejor que -10+1 = -9
});

test("isState rechaza ids de ficha duplicados", () => {
  expect(isState(estado("A", 1, [[0, 0, "A1"], [1, 1, "A1"]]))).toBe(false);
  expect(isState(estado("A", 1, [[0, 0, "A1"], [1, 1, "A2"]]))).toBe(true);
});

test("simulación con el motor de reglas: 100 partidas sin una sola jugada inválida", () => {
  const rng = crearRng(7);
  for (let i = 0; i < 100; i++) {
    const r = jugarPartida({ A: chooseMove, B: chooseMove }, rng);
    expect(r.invalidas).toEqual({ A: 0, B: 0 });
    expect(r.derrotaTecnica).toBeNull();
  }
});

test("el bot nuevo supera a la versión original jugando contra ella", () => {
  const rng = crearRng(99);
  let victoriasNuevo = 0, victoriasOriginal = 0;
  for (let i = 0; i < 100; i++) {
    const nuevoEsA = i % 2 === 0; // alterna quién mueve primero
    const r = jugarPartida(
      nuevoEsA ? { A: chooseMove, B: estrategiaOriginal } : { A: estrategiaOriginal, B: chooseMove }, rng);
    if (r.ganador === (nuevoEsA ? "A" : "B")) victoriasNuevo++;
    else if (r.ganador !== "empate") victoriasOriginal++;
  }
  expect(victoriasNuevo).toBeGreaterThan(victoriasOriginal);
});
