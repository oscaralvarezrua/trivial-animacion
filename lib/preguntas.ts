import { DISNEY } from "./banco/disney";
import { ESTUDIOS } from "./banco/estudios";
import { SERIES } from "./banco/series";
import type { Question } from "./types";

/**
 * La pregunta 83 que quedó pendiente en la partida de ChatGPT. Vive aparte
 * porque el estado inicial la referencia por id: es lo primero que se sirve al
 * continuar la partida guardada.
 */
export const PREGUNTA_PENDIENTE: Question = {
  id: "megamind-roxanne",
  franchise: "Megamind",
  emoji: "🦸",
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

  for (const q of PREGUNTAS) {
    if (vistos.has(q.id)) errores.push(`Id repetido: ${q.id}`);
    vistos.add(q.id);

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

  return errores;
}
