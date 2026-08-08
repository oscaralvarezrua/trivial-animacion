import { PREGUNTA_PENDIENTE } from "./preguntas";
import type { GameState } from "./types";

/**
 * La partida tal y como quedó en ChatGPT: 59-57, Alicia ya había contestado su
 * pregunta 82 y estaba pendiente la 83 de Oscar (la de Megamind).
 *
 * Se usa una única vez, la primera vez que se abre la web y la base de datos
 * está vacía. A partir de ahí manda lo que haya en Supabase.
 */
export function partidaGuardada(): GameState {
  return {
    version: 1,
    scores: { oscar: 59, alicia: 57 },
    turn: "oscar",
    nextNumber: { oscar: 83, alicia: 83 },
    currentQuestionId: PREGUNTA_PENDIENTE.id,
    usedQuestionIds: [PREGUNTA_PENDIENTE.id],
    history: [],
    overrides: { oscar: 0, alicia: 0 },
    roundDifficulty: PREGUNTA_PENDIENTE.difficulty,
    roundFranchise: PREGUNTA_PENDIENTE.franchise,
    updatedAt: new Date().toISOString(),
  };
}
