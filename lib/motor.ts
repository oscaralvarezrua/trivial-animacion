import { PREGUNTAS, porId } from "./preguntas";
import type {
  Difficulty,
  GameState,
  HistoryEntry,
  Player,
  Question,
  QuestionFormat,
  Rebound,
} from "./types";

/** Una franquicia no puede repetirse hasta que hayan pasado 8 preguntas. */
const ESPERA_FRANQUICIA = 8;
/** Ningún formato puede salir más de dos veces seguidas. */
const MAX_FORMATO_SEGUIDO = 2;

const REPARTO_DIFICULTAD: [Difficulty, number][] = [
  ["facil", 0.6],
  ["media", 0.3],
  ["dificil", 0.1],
];

/**
 * Dos reglas del juego chocan entre sí: las preguntas difíciles tienen que ser
 * de elección múltiple, pero ningún formato puede repetirse más de dos veces
 * seguidas. Si la anterior ya era de opciones y sale ronda difícil, las dos
 * preguntas de la ronda serían de opciones y habría tres seguidas.
 *
 * Se arregla en el origen: cuando la última pregunta fue de opciones, esta
 * ronda no puede ser difícil. Así ninguna de las dos reglas llega a romperse.
 */
function sortearDificultad(permitirDificil: boolean): Difficulty {
  const opciones = permitirDificil
    ? REPARTO_DIFICULTAD
    : REPARTO_DIFICULTAD.filter(([d]) => d !== "dificil");

  const total = opciones.reduce((suma, [, peso]) => suma + peso, 0);
  const tirada = Math.random() * total;

  let acumulado = 0;
  for (const [dificultad, peso] of opciones) {
    acumulado += peso;
    if (tirada < acumulado) return dificultad;
  }
  return "media";
}

function alAzar<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

/** Formato que ya ha salido dos veces seguidas y por tanto queda vetado. */
function formatoVetado(historial: HistoryEntry[]): QuestionFormat | null {
  if (historial.length < MAX_FORMATO_SEGUIDO) return null;
  const ultimos = historial.slice(-MAX_FORMATO_SEGUIDO);
  const formato = ultimos[0].format;
  return ultimos.every((e) => e.format === formato) ? formato : null;
}

function franquiciasRecientes(historial: HistoryEntry[], espera: number): Set<string> {
  return new Set(historial.slice(-espera).map((e) => e.franchise));
}

/**
 * Elige la siguiente pregunta aplicando las reglas de variedad. Los filtros se
 * van soltando de menos a más importante si no queda nada que servir: antes
 * repetir formato que quedarse sin partida.
 */
export function elegirPregunta(
  estado: GameState,
  dificultad: Difficulty,
): Question | null {
  const usadas = new Set(estado.usedQuestionIds);
  const disponibles = PREGUNTAS.filter((q) => !usadas.has(q.id));
  if (disponibles.length === 0) return null;

  const veto = formatoVetado(estado.history);

  // De la más deseable a la más relajada; la primera que dé resultado, gana.
  // El orden en que se cede importa: repetir formato canta mucho más que
  // repetir franquicia antes de tiempo, así que la franquicia cede primero.
  const noRepiteRonda = (q: Question) => q.franchise !== estado.roundFranchise;

  const intentos: ((q: Question) => boolean)[] = [
    (q) =>
      q.difficulty === dificultad &&
      noRepiteRonda(q) &&
      !franquiciasRecientes(estado.history, ESPERA_FRANQUICIA).has(q.franchise) &&
      q.format !== veto,
    // Se acorta la espera de franquicia a la mitad.
    (q) =>
      q.difficulty === dificultad &&
      noRepiteRonda(q) &&
      !franquiciasRecientes(estado.history, 4).has(q.franchise) &&
      q.format !== veto,
    // Se retira la espera de franquicia, salvo la de la propia ronda.
    (q) => q.difficulty === dificultad && noRepiteRonda(q) && q.format !== veto,
    // Se cede en la dificultad antes que en el formato.
    (q) => noRepiteRonda(q) && !franquiciasRecientes(estado.history, 4).has(q.franchise) && q.format !== veto,
    (q) => noRepiteRonda(q) && q.format !== veto,
    // Último recurso: se admite repetir formato.
    (q) => noRepiteRonda(q),
    () => true,
  ];

  for (const filtro of intentos) {
    const candidatas = disponibles.filter(filtro);
    if (candidatas.length > 0) return alAzar(candidatas);
  }

  return null;
}

/**
 * Deja el estado con una pregunta servida y esperando respuesta. Si el turno
 * es de Oscar arranca ronda nueva, así que se sortea la dificultad; Alicia
 * hereda esa misma dificultad para que la ronda sea justa.
 */
export function servirPregunta(estado: GameState): GameState {
  const arrancaRonda = estado.turn === "oscar";
  const anterior = estado.history.at(-1);
  const dificultad = arrancaRonda
    ? sortearDificultad(anterior?.format !== "multiple")
    : (estado.roundDifficulty ?? sortearDificultad(true));

  const siguiente = elegirPregunta(
    arrancaRonda ? { ...estado, roundFranchise: null } : estado,
    dificultad,
  );
  if (!siguiente) return estado;

  return {
    ...estado,
    currentQuestionId: siguiente.id,
    usedQuestionIds: [...estado.usedQuestionIds, siguiente.id],
    roundDifficulty: dificultad,
    roundFranchise: arrancaRonda ? siguiente.franchise : estado.roundFranchise,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Registra la respuesta y mueve el marcador. Si es acierto, pasa el turno y
 * toca enseñar el veredicto. Si es fallo, la pregunta rebota al rival: no se
 * revela nada todavía y el turno se queda quieto hasta que resuelva el rebote.
 */
export function responder(
  estado: GameState,
  acierto: boolean,
  respuestaDada: string,
): GameState {
  const pregunta = estado.currentQuestionId ? porId(estado.currentQuestionId) : null;
  if (!pregunta) return estado;

  const jugador = estado.turn;
  const entrada: HistoryEntry = {
    n: estado.nextNumber[jugador],
    player: jugador,
    questionId: pregunta.id,
    franchise: pregunta.franchise,
    format: pregunta.format,
    difficulty: pregunta.difficulty,
    correct: acierto,
    given: respuestaDada,
    at: new Date().toISOString(),
  };

  const base: GameState = {
    ...estado,
    scores: {
      ...estado.scores,
      [jugador]: estado.scores[jugador] + (acierto ? 1 : 0),
    },
    nextNumber: { ...estado.nextNumber, [jugador]: estado.nextNumber[jugador] + 1 },
    history: [...estado.history, entrada],
    updatedAt: new Date().toISOString(),
  };

  if (acierto) {
    return { ...base, turn: jugadorRival(jugador), currentQuestionId: null, rebote: null };
  }

  // La pregunta se mantiene servida: el rival tiene que verla sin la solución.
  return { ...base, rebote: jugadorRival(jugador) };
}

/**
 * Cierra el rebote: lo anota en la pregunta que lo provocó (no como entrada
 * aparte, que contaría dos veces la franquicia y el formato y descuadraría las
 * reglas de variedad) y devuelve el turno a su curso normal.
 */
function cerrarRebote(estado: GameState, rebote: Rebound): GameState {
  const ultima = estado.history.at(-1);
  if (!ultima) return estado;

  return {
    ...estado,
    history: [...estado.history.slice(0, -1), { ...ultima, rebound: rebote }],
    turn: rebote.player,
    currentQuestionId: null,
    rebote: null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * El rival se lanza a por el rebote. Acertar suma 1 y fallar resta 1, con suelo
 * en cero: el castigo existe, pero nadie acaba en negativo.
 */
export function responderRebote(
  estado: GameState,
  acierto: boolean,
  respuestaDada: string,
): GameState {
  const jugador = estado.rebote;
  if (!jugador) return estado;

  const anterior = estado.scores[jugador];
  const nuevo = Math.max(0, anterior + (acierto ? 1 : -1));

  const cerrado = cerrarRebote(estado, {
    player: jugador,
    outcome: acierto ? "acierto" : "fallo",
    given: respuestaDada,
    delta: nuevo - anterior,
  });

  return { ...cerrado, scores: { ...cerrado.scores, [jugador]: nuevo } };
}

/** El rival no se la sabe y pasa: el marcador no se mueve. */
export function pasarRebote(estado: GameState): GameState {
  const jugador = estado.rebote;
  if (!jugador) return estado;

  return cerrarRebote(estado, {
    player: jugador,
    outcome: "pasa",
    given: "",
    delta: 0,
  });
}

/**
 * Reglas 5 y 6: pregunta anulada o ya salida. No toca el marcador, no hace
 * perder el turno y sirve otra al mismo jugador. La descartada queda marcada
 * como usada para que no vuelva a aparecer.
 */
export function descartarPregunta(estado: GameState): GameState {
  if (!estado.currentQuestionId) return estado;

  const arrancaRonda = estado.turn === "oscar";
  const limpio: GameState = {
    ...estado,
    currentQuestionId: null,
    // Si la descartada marcaba la franquicia de la ronda, esa marca se cae con ella.
    roundFranchise: arrancaRonda ? null : estado.roundFranchise,
  };

  return servirPregunta(limpio);
}

/**
 * Botón «era correcta»: concede el punto de la última respuesta juzgada mal.
 * Queda anotado para que se vea cuántas veces lo usa cada uno.
 *
 * Con el rebote encima, darlo por bueno significa que nunca hubo fallo, así que
 * el rebote se cancela. Por eso el botón se ofrece antes de que el rival juegue:
 * después ya no habría manera de deshacer su punto.
 */
export function concederPunto(estado: GameState): GameState {
  const ultima = estado.history.at(-1);
  if (!ultima || ultima.correct) return estado;

  const historial = estado.history.slice(0, -1);
  historial.push({ ...ultima, correct: true, overridden: true });

  const base: GameState = {
    ...estado,
    scores: { ...estado.scores, [ultima.player]: estado.scores[ultima.player] + 1 },
    overrides: {
      ...estado.overrides,
      [ultima.player]: estado.overrides[ultima.player] + 1,
    },
    history: historial,
    updatedAt: new Date().toISOString(),
  };

  if (!estado.rebote) return base;

  return {
    ...base,
    rebote: null,
    currentQuestionId: null,
    turn: jugadorRival(ultima.player),
  };
}

export function partidaNueva(): GameState {
  const base: GameState = {
    version: 1,
    scores: { oscar: 0, alicia: 0 },
    turn: "oscar",
    nextNumber: { oscar: 1, alicia: 1 },
    currentQuestionId: null,
    usedQuestionIds: [],
    history: [],
    overrides: { oscar: 0, alicia: 0 },
    roundDifficulty: null,
    roundFranchise: null,
    rebote: null,
    updatedAt: new Date().toISOString(),
  };
  return servirPregunta(base);
}

export function jugadorRival(jugador: Player): Player {
  return jugador === "oscar" ? "alicia" : "oscar";
}
