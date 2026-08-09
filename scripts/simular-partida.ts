import {
  corregirRebote,
  corregirTitular,
  descartarPregunta,
  pasarRebote,
  responder,
  responderRebote,
  servirPregunta,
} from "../lib/motor";
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

/**
 * El veto del rebote en verdadero o falso se comprueba a mano sobre TODAS las
 * preguntas del formato. Dejarlo en manos de la partida simulada no vale: hay
 * seis en el banco y puede que ninguna llegue a fallarse.
 */
{
  const limpio: GameState = {
    ...partidaGuardada(),
    history: [],
    usedQuestionIds: [],
    rebote: null,
  };
  const verdaderoFalso = PREGUNTAS.filter((q) => q.format === "vf");

  for (const q of verdaderoFalso) {
    const tras = responder({ ...limpio, currentQuestionId: q.id }, false, "fallo");
    if (tras.rebote) {
      console.log(`FALLO: la pregunta de verdadero o falso ${q.id} ha abierto rebote`);
      process.exit(1);
    }
  }

  // Y el contraste: cualquier otro formato sí tiene que abrirlo.
  const otra = PREGUNTAS.find((q) => q.format !== "vf")!;
  if (!responder({ ...limpio, currentQuestionId: otra.id }, false, "fallo").rebote) {
    console.log(`FALLO: ${otra.id} tenía que haber abierto rebote y no lo hizo`);
    process.exit(1);
  }

  console.log(
    `Veto del rebote comprobado en las ${verdaderoFalso.length} preguntas de ` +
      `verdadero o falso, y el rebote sigue abriéndose en el resto.`,
  );
}

/**
 * Correcciones del veredicto. Es la parte con más aristas del motor, porque hay
 * que deshacer lo ya aplicado y aplicar lo contrario sin saltarse el suelo en
 * cero, así que se comprueba caso por caso y no al azar.
 */
{
  const fallo = (mensaje: string): never => {
    console.log(`FALLO: ${mensaje}`);
    process.exit(1);
  };

  const base: GameState = {
    ...partidaGuardada(),
    history: [],
    usedQuestionIds: [],
    rebote: null,
    scores: { oscar: 5, alicia: 5 },
  };
  const conRebote = PREGUNTAS.find((q) => q.format !== "vf")!;
  const vf = PREGUNTAS.find((q) => q.format === "vf")!;

  // 1. El titular falla, el rival pincha el rebote y luego se corrige al
  //    titular: recupera su punto y el rival recupera el suyo.
  let e = responder({ ...base, currentQuestionId: conRebote.id }, false, "mal");
  e = responderRebote(e, false, "mal");
  if (e.scores.alicia !== 4) fallo(`el rebote fallado dejó a Alicia en ${e.scores.alicia}`);
  e = corregirTitular(e);
  if (e.scores.oscar !== 6) fallo(`corregir a acierto dejó a Oscar en ${e.scores.oscar}`);
  if (e.scores.alicia !== 5) fallo(`el rebote no se deshizo: Alicia en ${e.scores.alicia}`);
  if (e.history.at(-1)!.rebound) fallo("el rebote sigue anotado tras corregir");

  // 2. Un acierto corregido a fallo abre el rebote y devuelve la pregunta.
  e = corregirTitular(responder({ ...base, currentQuestionId: conRebote.id }, true, "bien"));
  if (e.scores.oscar !== 5) fallo(`quitar el punto dejó a Oscar en ${e.scores.oscar}`);
  if (e.rebote !== "alicia") fallo("corregir a fallo no ha abierto el rebote");
  if (e.currentQuestionId !== conRebote.id) fallo("la pregunta no ha vuelto a servirse");

  // 3. En verdadero o falso, corregir a fallo quita el punto y nada más.
  e = corregirTitular(responder({ ...base, currentQuestionId: vf.id }, true, "bien"));
  if (e.scores.oscar !== 5) fallo(`en vf quitar el punto dejó a Oscar en ${e.scores.oscar}`);
  if (e.rebote) fallo("verdadero o falso no debe abrir rebote al corregir");

  // 4. El resultado del rebote se puede dar la vuelta, y volver a darla.
  e = responderRebote(responder({ ...base, currentQuestionId: conRebote.id }, false, "mal"), true, "bien");
  if (e.scores.alicia !== 6) fallo(`el rebote acertado dejó a Alicia en ${e.scores.alicia}`);
  e = corregirRebote(e);
  if (e.scores.alicia !== 4) fallo(`corregir el rebote a fallo dejó a Alicia en ${e.scores.alicia}`);
  e = corregirRebote(e);
  if (e.scores.alicia !== 6) fallo(`volver a corregirlo dejó a Alicia en ${e.scores.alicia}`);

  // 5. El caso que justifica guardar el delta: falla el rebote estando a cero,
  //    así que no resta nada. Al corregirlo tiene que subir a 1, no a 2.
  const aCero: GameState = { ...base, scores: { oscar: 5, alicia: 0 } };
  e = responderRebote(responder({ ...aCero, currentQuestionId: conRebote.id }, false, "mal"), false, "mal");
  if (e.scores.alicia !== 0) fallo(`el suelo falló: Alicia en ${e.scores.alicia}`);
  e = corregirRebote(e);
  if (e.scores.alicia !== 1) fallo(`corregir un rebote frenado por el suelo dejó a Alicia en ${e.scores.alicia}`);

  console.log("Correcciones del veredicto comprobadas en sus cinco casos.\n");
}

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

  // Si el titular falló, el rival tiene rebote: a veces se lanza, a veces pasa.
  if (estado.rebote) {
    const quien = estado.rebote;
    const antes = estado.scores[quien];

    if (Math.random() < 0.5) {
      const acierta = Math.random() < 0.5;
      estado = responderRebote(estado, acierta, "rebote simulado");
      const esperado = Math.max(0, antes + (acierta ? 1 : -1));
      if (estado.scores[quien] !== esperado) {
        console.log(
          `FALLO: el rebote dejó a ${quien} en ${estado.scores[quien]} y tocaba ${esperado}`,
        );
        process.exit(1);
      }
    } else {
      estado = pasarRebote(estado);
      if (estado.scores[quien] !== antes) {
        console.log("FALLO: pasar el rebote ha movido el marcador");
        process.exit(1);
      }
    }

    if (estado.rebote) {
      console.log("FALLO: el rebote sigue pendiente después de resolverlo");
      process.exit(1);
    }
    if (estado.turn !== quien) {
      console.log("FALLO: tras el rebote el turno no ha pasado a quien lo jugó");
      process.exit(1);
    }
  }
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

const rebotes = h.filter((e) => e.rebound);
const porResultado = (r: string) => rebotes.filter((e) => e.rebound!.outcome === r).length;

console.log(`Preguntas jugadas: ${h.length}`);
console.log(`Marcador final: Oscar ${estado.scores.oscar} - Alicia ${estado.scores.alicia}`);
console.log(
  `Rebotes jugados: ${rebotes.length} ` +
    `(acertados ${porResultado("acierto")}, fallados ${porResultado("fallo")}, ` +
    `pasados ${porResultado("pasa")})`,
);

// El suelo en cero es regla: un fallo resta, pero nadie acaba en negativo.
if (estado.scores.oscar < 0 || estado.scores.alicia < 0) {
  problemas.push("Algún marcador ha quedado en negativo");
}

// En verdadero o falso el rebote regalaría el punto, así que no debe existir.
const vfFallados = h.filter((e) => e.format === "vf" && !e.correct);
if (rebotes.some((e) => e.format === "vf")) {
  problemas.push("Ha habido rebote en una pregunta de verdadero o falso");
}
console.log(
  `Verdadero o falso fallados: ${vfFallados.length}, y ninguno rebotó ` +
    `(${rebotes.filter((e) => e.format === "vf").length} rebotes en vf)`,
);
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
