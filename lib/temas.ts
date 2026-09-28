/**
 * Los temas de Sabelotodo: lo que el menú enseña como «categoría».
 *
 * Ojo al nombre, porque hay dos cosas que se llaman parecido y no son lo mismo:
 *
 * - **Tema** es esto: Palomitas, Música. Es lo que se elige en la cabecera y lo
 *   que decide de qué banco se sirven las preguntas.
 * - **Categoría** (`lib/categorias.ts`) es el grupo dentro de un tema: Disney,
 *   Pixar, Reggaetón, Trap… Es lo que desglosa el resumen de fin de partida.
 *
 * Se llamó «tema» al de arriba justamente para no tener dos `Categoria` en el
 * código significando cosas distintas.
 *
 * **Cambiar de tema termina la partida.** No se guarda una por tema: al cambiar
 * se enseña el resumen de lo jugado y se empieza de cero en el tema nuevo. Es
 * decisión tomada a propósito, porque dos partidas a medias en paralelo obligan
 * a llevar dos marcadores y a decidir cuál es «el bueno», y aquí el marcador es
 * lo único que importa de verdad.
 */

export const TEMAS = ["palomitas", "musica", "historia"] as const;

export type Tema = (typeof TEMAS)[number];

export const TEMA: Record<Tema, { nombre: string; emoji: string; de: string }> = {
  palomitas: { nombre: "Palomitas", emoji: "🍿", de: "cine, series y animación" },
  musica: { nombre: "Música", emoji: "🎵", de: "canciones y artistas" },
  historia: { nombre: "Historia", emoji: "🗺️", de: "historia de todo el mundo" },
};

/**
 * El tema de las partidas guardadas antes de que existieran los temas. Sin
 * esto, la partida que lleváis en Supabase se quedaría sin banco del que tirar.
 */
export const TEMA_POR_DEFECTO: Tema = "palomitas";

/** El tema de un estado, tolerando las partidas guardadas que no lo traen. */
export function temaDe(tema: Tema | undefined | null): Tema {
  return tema && TEMAS.includes(tema) ? tema : TEMA_POR_DEFECTO;
}
