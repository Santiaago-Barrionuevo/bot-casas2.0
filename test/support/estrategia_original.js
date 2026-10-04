// 
function calcularDestino(fila, columna, direccion, dado) {
    if (direccion === "N") {
    return [(fila - dado + 10) % 10, columna];
    }
    if (direccion === "S") {
    return [(fila + dado) % 10, columna];
    }
    if (direccion === "E") {
    return [fila, (columna + dado) % 10];
    }
    if (direccion === "O") {
    return [fila, (columna - dado + 10) % 10];
    }
}

// esta función recorre el tablero y devuelve un array con la posición de las casas neutrales
function buscarCasas(tablero) {
    const casas = [];
    for (let f = 0; f < 10; f++) {
        for (let c = 0; c < 10; c++) {
        if (tablero[f][c] === "N") casas.push([f, c]);
        }
    }
    return casas;
}

// Mide la distancia más corta entre dos puntos (incluso da la vuelta!!)
function distancia(a, b) {
    const df = Math.min(Math.abs(a - b), 10 - Math.abs(a - b));
    return df;
}

// Elige, una de las 4 direcciones posibles, la que deja a la ficha sobre una casa
// o, si ninguna llega a una casa, la que la deja más cerca de la mas cercana
function elegirDireccion(fila, columna, dado, casas) {
    const direcciones = ["N", "S", "E", "O"];
    let mejorDireccion = direcciones[0];
    let mejorDistancia = Infinity; // <- Este infinity funciona como una promesa de que cualquier distancia (numero) que ingrese, será mayor

    for (const direccion of direcciones) {
    const [f, c] = calcularDestino(fila, columna, direccion, dado);

    // Si cae justo sobre una casa, es la mejor jugada posible: se elije esa
    const conquistaCasa = casas.some(([cf, cc]) => cf === f && cc === c);
    if (conquistaCasa) return direccion;

    // Si no hay ninguna casa en el tablero, cualquier dirección sirve.
    if (casas.length === 0) continue;

    // Si no conquista alguna, medimos qué tan lejos queda de la casa más cercana.
    const distanciaMinima = Math.min(
        ...casas.map(([cf, cc]) => distancia(f, cf) + distancia(c, cc))
    );

    // Este bucle compara las 4 distancias y elige la mejor.
    if (distanciaMinima < mejorDistancia) {
        mejorDistancia = distanciaMinima;
        mejorDireccion = direccion;
    }
    }

    return mejorDireccion;
}

export function chooseMove(state) {
    const casas = buscarCasas(state.tablero);
    const movements = {};

    for (let fila = 0; fila < 10; fila++) {
    for (let columna = 0; columna < 10; columna++) {
        const cell = state.tablero[fila][columna];
        if (cell.startsWith(state.jugador)) {
        movements[cell] = elegirDireccion(fila, columna, state.dado, casas);
        }
    }
    }

    return movements;
}