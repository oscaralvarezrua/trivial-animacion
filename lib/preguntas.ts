import { DISNEY } from "./banco/disney";
import { ESTUDIOS } from "./banco/estudios";
import { SERIES } from "./banco/series";
import { SUPERHEROES } from "./banco/superheroes";
import { IMAGEN_REAL } from "./banco/imagen-real";
import { TELEVISION } from "./banco/television";
import { categoriaDe, emojiDe } from "./categorias";
import { pistaDelEmoji } from "./pistas";
import type { Difficulty, Question } from "./types";

/**
 * La pregunta 83 que quedó pendiente en la partida de ChatGPT. Vive aparte
 * porque el estado inicial la referencia por id: es lo primero que se sirve al
 * continuar la partida guardada.
 */
export const PREGUNTA_PENDIENTE: Question = {
  id: "megamind-roxanne",
  franchise: "Megamind",
  difficulty: "media",
  format: "corta",
  prompt: "¿Cómo se llama la periodista de la que se enamora Megamind?",
  hint: "(Solo el nombre.)",
  accepted: [["Roxanne", "Roxanne Ritchi", "Ritchi"]],
  official: "Roxanne Ritchi",
};

export const PREGUNTAS: Question[] = [
  PREGUNTA_PENDIENTE,
  ...DISNEY,
  ...ESTUDIOS,
  ...SERIES,
  ...SUPERHEROES,
  ...TELEVISION,
  ...IMAGEN_REAL,
];

const INDICE = new Map(PREGUNTAS.map((q) => [q.id, q]));

export function porId(id: string): Question | null {
  return INDICE.get(id) ?? null;
}

export function franquicias(): string[] {
  return [...new Set(PREGUNTAS.map((q) => q.franchise))].sort();
}

/**
 * Comprobaciones que deben cumplirse siempre en el banco. Se ejecutan con
 * `npm run validar`, no en tiempo de ejecución.
 */
export function validarBanco(): string[] {
  const errores: string[] = [];
  const vistos = new Set<string>();
  const sinCategoria = new Set<string>();
  // Respuestas ya usadas dentro de una misma franquicia, para no preguntar dos
  // veces lo mismo con otras palabras. Los verdadero o falso quedan fuera:
  // todos responden «Verdadero» o «Falso» y chocarían siempre entre sí.
  const respuestas = new Set<string>();

  for (const q of PREGUNTAS) {
    if (vistos.has(q.id)) errores.push(`Id repetido: ${q.id}`);
    vistos.add(q.id);

    if (!categoriaDe(q.franchise)) sinCategoria.add(q.franchise);

    if (q.format !== "vf") {
      const clave = `${q.franchise}::${q.official.trim().toLowerCase()}`;
      if (respuestas.has(clave)) {
        errores.push(`${q.id}: repite una respuesta ya usada en ${q.franchise}`);
      }
      respuestas.add(clave);
    }

    const emoji = emojiDe(q.franchise);
    const pista = pistaDelEmoji(emoji, q);
    if (pista) {
      errores.push(
        `${q.id}: el emoji ${emoji} de la categoría estropea la pregunta, ${pista}`,
      );
    }

    if (!q.prompt.trim()) errores.push(`${q.id}: enunciado vacío`);
    if (!q.official.trim()) errores.push(`${q.id}: falta la respuesta oficial`);

    // Regla del enunciado: lo difícil y lo muy secundario, siempre en opciones.
    if (q.difficulty === "dificil" && q.format !== "multiple") {
      errores.push(`${q.id}: es difícil pero no es de elección múltiple`);
    }

    switch (q.format) {
      case "corta":
      case "describir":
      case "completar":
        if (q.accepted.length === 0) errores.push(`${q.id}: sin respuestas aceptadas`);
        if (q.accepted.some((hueco) => hueco.length === 0)) {
          errores.push(`${q.id}: hay un hueco sin variantes`);
        }
        break;
      case "multiple":
        if (q.options.length < 3) errores.push(`${q.id}: menos de 3 opciones`);
        if (new Set(q.options).size !== q.options.length) {
          errores.push(`${q.id}: opciones repetidas`);
        }
        if (q.correct < 0 || q.correct >= q.options.length) {
          errores.push(`${q.id}: índice de la opción correcta fuera de rango`);
        }
        break;
      case "orden":
        if (q.items.length < 3) errores.push(`${q.id}: hacen falta al menos 3 elementos`);
        break;
      case "relacionar":
        if (q.pairs.length < 3) errores.push(`${q.id}: hacen falta al menos 3 parejas`);
        break;
    }
  }

  for (const f of sinCategoria) {
    errores.push(`La franquicia «${f}» no tiene categoría en lib/categorias.ts`);
  }

  errores.push(...revisarVerdaderoFalso());

  return errores;
}

/**
 * Los verdadero o falso tienen que estar repartidos entre unos y otros.
 *
 * No es una manía de simetría: si casi todos son «verdadero», contestar siempre
 * que sí acierta la mayoría, y como en ese formato **no hay rebote**, el rival
 * ni siquiera puede castigarlo. El formato se convierte en puntos regalados.
 *
 * Se comprueba aquí porque ha pasado tres veces al ampliar el banco, siempre
 * igual: al redactar sale más natural afirmar algo cierto que inventar una
 * versión falsa creíble, y la desviación no se nota hasta que alguien la mide.
 *
 * Se mira también por dificultad, porque el peor caso que hubo no fue el global
 * sino que las 20 preguntas de dificultad media eran verdaderas las 20.
 */
function revisarVerdaderoFalso(): string[] {
  const errores: string[] = [];
  const vf = PREGUNTAS.filter((q) => q.format === "vf");

  const reparto = (lista: typeof vf) => {
    const verdaderas = lista.filter((q) => q.correct === true).length;
    return { verdaderas, total: lista.length, pct: verdaderas / lista.length };
  };

  // El margen global es estrecho: con muchas preguntas no hay excusa para
  // desviarse, y una de más o de menos no llega a moverlo.
  const MINIMO = 20;
  if (vf.length >= MINIMO) {
    const { verdaderas, total, pct } = reparto(vf);
    if (pct < 0.45 || pct > 0.55) {
      errores.push(
        `Los verdadero o falso están descompensados: ${verdaderas} verdaderas de ${total} ` +
          `(${Math.round(pct * 100)} %). Se admite entre el 45 % y el 55 %.`,
      );
    }
  }

  // Por dificultad se afloja el margen: los grupos son más pequeños y un
  // desvío de dos o tres preguntas no rompe el juego.
  for (const dificultad of ["facil", "media", "dificil"] as Difficulty[]) {
    const grupo = vf.filter((q) => q.difficulty === dificultad);
    if (grupo.length < 12) continue;

    const { verdaderas, total, pct } = reparto(grupo);
    if (pct < 0.35 || pct > 0.65) {
      errores.push(
        `Los verdadero o falso de dificultad ${dificultad} están descompensados: ` +
          `${verdaderas} verdaderas de ${total} (${Math.round(pct * 100)} %).`,
      );
    }
  }

  return errores;
}
