import { expect, test } from "@jest/globals";
import { chooseMove } from "../src/strategy.js";

const tableroVacio = () => Array.from({ length: 10 }, () => Array(10).fill(""));
const estado = (jugador, dado, celdas) => {
  const tablero = tableroVacio();
  for (const [f, c, v] of celdas) tablero[f][c] = v;
  return { jugador, dado, tablero };
};

test("el tablero es toroidal: avanza por el borde si es más corto", () => {
  // A1 en fila 9, casa en fila 0: "S" con dado 1 da la vuelta y conquista.
  expect(chooseMove(estado("A", 1, [[9, 5, "A1"], [0, 5, "N"]]))).toEqual({ A1: "S" });
  // A1 en columna 0, casa en columna 9: "O" con dado 1 da la vuelta.
  expect(chooseMove(estado("A", 1, [[4, 0, "A1"], [4, 9, "N"]]))).toEqual({ A1: "O" });
});

test("sin casas en el tablero, la dirección por defecto es N", () => {
  expect(chooseMove(estado("A", 2, [[3, 3, "A1"]]))).toEqual({ A1: "N" });
});

test("ante empate de distancia gana el orden N, S, E, O", () => {
  // Casa a (+3,0) y (0,+3): S y E conquistan; gana S por prioridad.
  expect(chooseMove(estado("A", 3, [[5, 5, "A1"], [8, 5, "N"], [5, 8, "N"]]))).toEqual({ A1: "S" });
});

test("prefiere conquistar aunque otra dirección acerque más a otra casa", () => {
  const s = estado("A", 3, [[5, 5, "A1"], [5, 8, "N"], [2, 5, "N"]]);
  // N cae en (2,5) y E en (5,8): ambas conquistan; N tiene prioridad.
  expect(chooseMove(s)).toEqual({ A1: "N" });
});
