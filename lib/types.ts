export type Player = "oscar" | "alicia";

export const PLAYERS: Record<Player, { nombre: string; emoji: string }> = {
  oscar: { nombre: "Oscar", emoji: "🟦" },
  alicia: { nombre: "Alicia", emoji: "🩷" },
};

export type Difficulty = "facil" | "media" | "dificil";

export type QuestionFormat =
  | "corta"
  | "multiple"
  | "vf"
  | "orden"
  | "relacionar"
  | "describir"
  | "completar";

export const FORMAT_LABEL: Record<QuestionFormat, string> = {
  corta: "Respuesta corta",
  multiple: "Elección múltiple",
  vf: "Verdadero o falso",
  orden: "Orden cronológico",
  relacionar: "Relacionar",
  describir: "Identifica el personaje",
  completar: "Completa la frase",
};

interface BaseQuestion {
  id: string;
  /** Franquicia: se usa para el bloqueo de 8 preguntas. */
  franchise: string;
  emoji: string;
  difficulty: Difficulty;
  prompt: string;
  /** Instrucción breve para responder, p. ej. "(Solo el nombre.)" */
  hint?: string;
  /** Explicación de una línea como máximo, mostrada tras responder. */
  note?: string;
  /** Grafía oficial de la respuesta, tal cual se muestra al revelarla. */
  official: string;
}

/**
 * `accepted` es una lista de huecos. El jugador debe acertar TODOS los huecos.
 * Cada hueco lleva sus variantes admitidas (el corrector ya tolera tildes y
 * erratas, así que aquí solo hacen falta variantes de verdad: apodos, apellido
 * suelto, sinónimos).
 */
type TextQuestion = BaseQuestion & {
  format: "corta" | "describir" | "completar";
  accepted: string[][];
};

type MultipleQuestion = BaseQuestion & {
  format: "multiple";
  options: string[];
  /** Índice de la opción correcta dentro de `options`. */
  correct: number;
};

type TrueFalseQuestion = BaseQuestion & {
  format: "vf";
  correct: boolean;
};

type OrderQuestion = BaseQuestion & {
  format: "orden";
  /** Elementos en el orden CORRECTO. La interfaz los baraja al mostrarlos. */
  items: string[];
};

type MatchQuestion = BaseQuestion & {
  format: "relacionar";
  pairs: { left: string; right: string }[];
};

export type Question =
  | TextQuestion
  | MultipleQuestion
  | TrueFalseQuestion
  | OrderQuestion
  | MatchQuestion;

/**
 * Rebote: cuando el titular falla, la pregunta pasa al rival, que elige entre
 * responder o pasar. Acertar suma 1, fallar resta 1 y pasar no mueve nada, para
 * que solo conteste si se la sabe.
 */
export interface Rebound {
  player: Player;
  outcome: "acierto" | "fallo" | "pasa";
  /** Lo que respondió. Vacío si pasó. */
  given: string;
  /**
   * Puntos que se movieron de verdad. Es 0 cuando falla estando a cero: el
   * suelo lo frena, y sin este dato el veredicto diría que ha perdido un punto
   * que nunca perdió.
   */
  delta: number;
}

export interface HistoryEntry {
  /** Número de pregunta de ese jugador (el 83 de Oscar, etc.). */
  n: number;
  player: Player;
  questionId: string;
  franchise: string;
  format: QuestionFormat;
  difficulty: Difficulty;
  correct: boolean;
  /** true si el punto se concedió con el botón «era correcta». */
  overridden?: boolean;
  /** Cómo acabó el rebote, si el titular falló y el rival llegó a jugarlo. */
  rebound?: Rebound;
  /** Lo que respondió el jugador, para poder repasar la partida. */
  given: string;
  at: string;
}

export interface GameState {
  version: number;
  scores: Record<Player, number>;
  turn: Player;
  /** Número que le toca a cada jugador en su PRÓXIMA pregunta. */
  nextNumber: Record<Player, number>;
  currentQuestionId: string | null;
  usedQuestionIds: string[];
  history: HistoryEntry[];
  /** Cuántas veces ha usado cada uno el botón «era correcta». */
  overrides: Record<Player, number>;
  /** Dificultad fijada para la ronda en curso, para que ambos jueguen igual. */
  roundDifficulty: Difficulty | null;
  /** Franquicia que ya ha salido en esta ronda; la otra no puede repetirla. */
  roundFranchise: string | null;
  /**
   * Jugador con un rebote pendiente. Mientras esté puesto manda él y no `turn`:
   * la pregunta sigue servida y sin revelar. Opcional porque las partidas
   * guardadas antes de existir el rebote no lo traen.
   */
  rebote?: Player | null;
  updatedAt: string;
}
