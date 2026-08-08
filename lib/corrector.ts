/**
 * Corrección de respuestas de texto libre.
 *
 * Regla 8 del juego: se aceptan erratas y aproximaciones fonéticas cuando el
 * personaje es inequívoco («Bemax» por Baymax, «Asoka» por Ahsoka), indicando
 * después la grafía oficial. Eso se implementa con normalización agresiva más
 * distancia de Levenshtein con umbral proporcional a la longitud.
 */

const ARTICULOS = /^(el|la|los|las|un|una|unos|unas)\s+/;

export function normalizar(texto: string): string {
  let s = texto
    .toLowerCase()
    // La ñ se aparta antes de descomponer, para no dejarla en n.
    .replace(/ñ/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(//g, "ñ")
    .replace(/[.,;:!¡?¿"'`´()\[\]{}_/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Los artículos delante sobran: «el Gato» y «gato» son la misma respuesta.
  while (ARTICULOS.test(s)) s = s.replace(ARTICULOS, "");

  return s;
}

/** Distancia de edición clásica, con una sola fila en memoria. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = fila[j];
      fila[j] = Math.min(
        fila[j] + 1, // borrado
        fila[j - 1] + 1, // inserción
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1), // sustitución
      );
      anterior = guardado;
    }
  }

  return fila[b.length];
}

/**
 * Cuántos errores de letra se toleran según lo larga que sea la respuesta.
 * Es deliberadamente estricto: los fallos fonéticos ya los caza el esqueleto
 * consonántico, así que aquí solo interesa el resbalón de teclado en nombres
 * largos («Rapuzel» por Rapunzel).
 */
function tolerancia(longitud: number): number {
  if (longitud <= 6) return 0;
  if (longitud <= 10) return 1;
  return 2;
}

/**
 * Esqueleto consonántico: cómo suena el nombre para alguien que escribe en
 * español. Quita vocales y h muda, unifica c/k/q, v/b y z/s, y aplasta las
 * letras dobles. «Baymax» y «Bemax» dan bmx; «Manny» y «Mani», mn.
 *
 * Esto es lo que separa una errata real de otro personaje: «Nala» da nl y
 * «Nana» da n, así que no se confunden por mucho que solo cambie una letra.
 */
function esqueleto(s: string): string {
  const consonantes = s
    .replace(/h/g, "")
    .replace(/qu?/g, "k")
    .replace(/c([ei])/g, "s$1")
    .replace(/c/g, "k")
    .replace(/v/g, "b")
    .replace(/z/g, "s")
    .replace(/[aeiouy\s]/g, "")
    .replace(/[^a-zñ]/g, "");

  // Aplasta consonantes repetidas seguidas: «hopps» y «hoops» acaban igual.
  return consonantes.replace(/(.)\1+/g, "$1");
}

type Coincidencia = "exacta" | "aproximada" | "ninguna";

function comparar(dada: string, esperada: string): Coincidencia {
  if (dada === esperada) return "exacta";

  const margen = tolerancia(Math.max(dada.length, esperada.length));
  if (margen > 0 && levenshtein(dada, esperada) <= margen) return "aproximada";

  // Misma sonoridad y longitud parecida: es la misma palabra mal escrita.
  if (
    Math.abs(dada.length - esperada.length) <= 3 &&
    esqueleto(dada) === esqueleto(esperada)
  ) {
    return "aproximada";
  }

  return "ninguna";
}

/**
 * ¿La respuesta del jugador contiene este hueco? Se prueba la frase entera y
 * también ventanas de palabras, para que «creo que es Roxanne Ritchi» valga.
 */
function cubreHueco(dada: string, variantes: string[]): Coincidencia {
  const palabras = dada.split(" ").filter(Boolean);
  let mejor: Coincidencia = "ninguna";

  for (const variante of variantes) {
    const objetivo = normalizar(variante);
    const nPalabras = objetivo.split(" ").length;

    const candidatos = [dada];
    for (let i = 0; i + nPalabras <= palabras.length; i++) {
      candidatos.push(palabras.slice(i, i + nPalabras).join(" "));
    }

    for (const candidato of candidatos) {
      const r = comparar(candidato, objetivo);
      if (r === "exacta") return "exacta";
      if (r === "aproximada") mejor = "aproximada";
    }
  }

  return mejor;
}

export interface Veredicto {
  acierto: boolean;
  /** true cuando se ha concedido pese a una errata: hay que citar la grafía oficial. */
  conErrata: boolean;
}

/**
 * `huecos` son las partes obligatorias de la respuesta. Regla 4: en preguntas
 * de varias respuestas hay que acertarlas todas, no hay medios puntos.
 */
export function corregirTexto(respuesta: string, huecos: string[][]): Veredicto {
  const dada = normalizar(respuesta);
  if (!dada) return { acierto: false, conErrata: false };

  let conErrata = false;

  for (const variantes of huecos) {
    const r = cubreHueco(dada, variantes);
    if (r === "ninguna") return { acierto: false, conErrata: false };
    if (r === "aproximada") conErrata = true;
  }

  return { acierto: true, conErrata };
}
