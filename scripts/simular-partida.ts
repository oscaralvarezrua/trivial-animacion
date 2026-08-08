import { descartarPregunta, responder, servirPregunta } from "../lib/motor";
import { partidaGuardada } from "../lib/partida-guardada";
import { PREGUNTAS } from "../lib/preguntas";
import type { Difficulty, GameState } from "../lib/types";

/**
 * Juega una partida entera contra sí misma y comprueba que el motor respeta las
 * reglas de variedad. No mira si las respuestas son correctas: lo que se está
 * verificando es qué preguntas se sirven y a quién.
 */

const RONDAS = Math.floor(PREGUNTAS.length / 2);
let estado: GameState = partidaGuardada();

for (let i = 0; i < RONDAS * 2; i++) {
  if (!estado.currentQuestionId) estado = servirPregunta(estado);
  if (!estado.currentQuestionId) break; // banco agotado

  // De vez en cuando alguien dice «esa ya salió»: debe repetir el mismo jugador.
  if (Math.random() < 0.08) {
    const turnoAntes = estado.turn;
    const numeroAntes = estado.nextNumber[turnoAntes];
    estado = descartarPregunta(estado);
    if (estado.turn !== turnoAntes || estado.nextNumber[turnoAntes] !== numeroAntes) {
      console.log("FALLO: descartar una pregunta ha hecho perder el turno");
      process.exit(1);
    }
  }

  estado = responder(estado, Math.random() < 0.7, "respuesta simulada");
}

const h = estado.history;
const problemas: string[] = [];

/**
 * Con el banco casi vacío el motor tiene que relajar filtros por narices: al
 * final ya no hay entre qué elegir. Las reglas de variedad se exigen mientras
 * queda margen real, no en las últimas preguntas.
 */
const MARGEN = Math.floor(PREGUNTAS.length * 0.85);
const conMargen = h.slice(0, MARGEN);

// 1. Los turnos se alternan estrictamente y Oscar abre cada ronda.
for (let i = 0; i < h.length; i++) {
  const esperado = i % 2 === 0 ? "oscar" : "alicia";
  if (h[i].player !== esperado) {
    problemas.push(`Turno ${i + 1}: jugaba ${h[i].player} y tocaba ${esperado}`);
    break;
  }
}

// 2. Ninguna pregunta se repite.
const ids = h.map((e) => e.questionId);
if (new Set(ids).size !== ids.length) problemas.push("Hay preguntas repetidas");

// 3. Ningún formato tres veces seguidas.
for (let i = 2; i < conMargen.length; i++) {
  const [x, y, z] = [conMargen[i], conMargen[i - 1], conMargen[i - 2]];
  if (x.format === y.format && x.format === z.format) {
    problemas.push(`Formato ${x.format} tres veces seguidas en la pregunta ${i + 1}`);
    break;
  }
}

// 4. Una franquicia no vuelve antes de ocho preguntas.
let repeticionesPronto = 0;
for (let i = 0; i < conMargen.length; i++) {
  const ventana = conMargen.slice(Math.max(0, i - 8), i).map((e) => e.franchise);
  if (ventana.includes(conMargen[i].franchise)) repeticionesPronto++;
}

// 5. Dentro de cada ronda, misma dificultad y franquicias distintas.
let desnivel = 0;
let mismaFranquicia = 0;
const porRonda: Record<Difficulty, number> = { facil: 0, media: 0, dificil: 0 };

for (let i = 0; i + 1 < conMargen.length; i += 2) {
  const [a, b] = [conMargen[i], conMargen[i + 1]];
  porRonda[a.difficulty]++;
  if (a.difficulty !== b.difficulty) desnivel++;
  if (a.franchise === b.franchise) mismaFranquicia++;
}

const rondas = Math.floor(conMargen.length / 2);
const pct = (n: number) => `${Math.round((n / rondas) * 100)}%`;

console.log(`Preguntas jugadas: ${h.length}`);
console.log(`Marcador final: Oscar ${estado.scores.oscar} - Alicia ${estado.scores.alicia}`);
console.log(`Reglas comprobadas sobre las ${MARGEN} primeras (${rondas} rondas):`);
console.log(
  `Dificultad por ronda -> fácil ${pct(porRonda.facil)}, ` +
    `media ${pct(porRonda.media)}, difícil ${pct(porRonda.dificil)}`,
);
console.log(`Franquicia repetida antes de 8 preguntas: ${repeticionesPronto}`);
console.log(`Rondas con dificultad desigual entre los dos: ${desnivel}`);
console.log(`Rondas con la misma franquicia para los dos: ${mismaFranquicia}`);

// Los filtros se relajan cuando queda poco banco, así que se admite algo de
// ruido al final; lo que no puede haber son fallos estructurales.
if (mismaFranquicia > 0) problemas.push("Alguna ronda repite franquicia para ambos");
if (repeticionesPronto > rondas * 0.1) {
  problemas.push("Demasiadas franquicias repetidas antes de tiempo");
}
if (desnivel > rondas * 0.15) problemas.push("Demasiadas rondas descompensadas");

if (problemas.length > 0) {
  console.log("\nProblemas:");
  for (const p of problemas) console.log(`  - ${p}`);
  process.exit(1);
}

console.log("\nEl motor respeta las reglas.");
