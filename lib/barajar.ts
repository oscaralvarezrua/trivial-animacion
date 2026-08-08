/**
 * Barajado determinista a partir de una semilla de texto.
 *
 * Hace falta porque en el banco la respuesta correcta siempre está en primera
 * posición y hay que mezclarla, pero un Math.random daría un orden distinto en
 * el servidor y en el cliente, y React se quejaría de la hidratación. Con la
 * semilla (el id de la pregunta) el orden es siempre el mismo en ambos lados.
 */

function semillaNumerica(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: pequeño, rápido y suficiente para mezclar cuatro opciones. */
function generador(semilla: number): () => number {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function barajar<T>(items: T[], semilla: string): T[] {
  const siguiente = generador(semillaNumerica(semilla));
  const copia = [...items];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(siguiente() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}
