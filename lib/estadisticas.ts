import { categoriaDe, type Categoria } from "./categorias";
import type { GameState, Player, QuestionFormat } from "./types";

/**
 * Estadísticas de la partida, por jugador, desglosadas por formato y por
 * categoría. Se calculan enteras desde `history`, así que no hacen falta
 * contadores en el estado ni migrar las partidas ya guardadas.
 *
 * Los rebotes cuentan como un intento más del rival dentro de la misma
 * pregunta: si el titular falla y el rival acierta, eso son un fallo para uno y
 * un acierto para el otro. Pasar no cuenta como intento, porque no llegó a
 * responder: si contara como fallo, el marcador diría que se equivocó cuando lo
 * que hizo fue no arriesgarse.
 */

export interface Recuento {
  aciertos: number;
  fallos: number;
}

export interface EstadisticasJugador {
  total: Recuento;
  porFormato: Partial<Record<QuestionFormat, Recuento>>;
  porCategoria: Partial<Record<Categoria, Recuento>>;
}

export type Estadisticas = Record<Player, EstadisticasJugador>;

function vacias(): EstadisticasJugador {
  return { total: { aciertos: 0, fallos: 0 }, porFormato: {}, porCategoria: {} };
}

function anotar(r: Recuento | undefined, acierto: boolean): Recuento {
  const base = r ?? { aciertos: 0, fallos: 0 };
  return acierto
    ? { ...base, aciertos: base.aciertos + 1 }
    : { ...base, fallos: base.fallos + 1 };
}

export function calcularEstadisticas(estado: GameState): Estadisticas {
  const stats: Estadisticas = { oscar: vacias(), alicia: vacias() };

  const sumar = (
    jugador: Player,
    formato: QuestionFormat,
    franquicia: string,
    acierto: boolean,
  ) => {
    const s = stats[jugador];
    s.total = anotar(s.total, acierto);
    s.porFormato[formato] = anotar(s.porFormato[formato], acierto);
    const cat = categoriaDe(franquicia);
    if (cat) s.porCategoria[cat] = anotar(s.porCategoria[cat], acierto);
  };

  for (const e of estado.history) {
    sumar(e.player, e.format, e.franchise, e.correct);

    // El rebote se guarda dentro de la pregunta que lo provocó, no como entrada
    // aparte, así que hay que sacarlo de aquí.
    if (e.rebound && e.rebound.outcome !== "pasa") {
      sumar(e.rebound.player, e.format, e.franchise, e.rebound.outcome === "acierto");
    }
  }

  return stats;
}

export function intentos(r: Recuento): number {
  return r.aciertos + r.fallos;
}

/** Porcentaje de acierto redondeado. Devuelve null si no hubo ningún intento. */
export function porcentaje(r: Recuento): number | null {
  const n = intentos(r);
  return n === 0 ? null : Math.round((r.aciertos / n) * 100);
}

/**
 * Cuántas veces cada jugador pasó de un rebote. No es un fallo, pero dice algo:
 * quien pasa mucho es que no se arriesga.
 */
export function rebotesPasados(estado: GameState): Record<Player, number> {
  const pasados: Record<Player, number> = { oscar: 0, alicia: 0 };
  for (const e of estado.history) {
    if (e.rebound?.outcome === "pasa") pasados[e.rebound.player]++;
  }
  return pasados;
}

/** Filas ordenadas de más intentos a menos, para pintar solo lo que se ha jugado. */
export function filas<K extends string>(
  registro: Partial<Record<K, Recuento>>,
): { clave: K; recuento: Recuento }[] {
  return (Object.entries(registro) as [K, Recuento][])
    .filter(([, r]) => intentos(r) > 0)
    .sort((a, b) => intentos(b[1]) - intentos(a[1]))
    .map(([clave, recuento]) => ({ clave, recuento }));
}
