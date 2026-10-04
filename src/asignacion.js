/**
 * Problema de asignación (algoritmo húngaro, variante con potenciales).
 * Asigna a cada fila una columna distinta minimizando el costo total.
 * Admite costos negativos. Requiere filas <= columnas.
 *
 * Complejidad: O(filas² · columnas). Espacio: O(filas · columnas) por la matriz.
 *
 * @param {number[][]} costo Matriz filas × columnas.
 * @returns {number[]} columnaDeFila[i] = columna asignada a la fila i.
 */
export function asignacionMinima(costo) {
  const n = costo.length;
  const m = n === 0 ? 0 : costo[0].length;
  if (n > m) throw new RangeError("Se requieren al menos tantas columnas como filas.");

  const u = new Float64Array(n + 1);
  const v = new Float64Array(m + 1);
  const p = new Int32Array(m + 1); // p[j] = fila asignada a la columna j (1-based)
  const camino = new Int32Array(m + 1);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(m + 1).fill(Infinity);
    const usada = new Uint8Array(m + 1);

    do {
      usada[j0] = 1;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= m; j++) {
        if (usada[j]) continue;
        const actual = costo[i0 - 1][j - 1] - u[i0] - v[j];
        if (actual < minv[j]) {
          minv[j] = actual;
          camino[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j++) {
        if (usada[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = camino[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const columnaDeFila = new Array(n);
  for (let j = 1; j <= m; j++) if (p[j] !== 0) columnaDeFila[p[j] - 1] = j - 1;
  return columnaDeFila;
}
