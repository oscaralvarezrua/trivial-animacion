"use client";

import {
  calcularEstadisticas,
  filas,
  intentos,
  porcentaje,
  rebotesPasados,
  type Recuento,
} from "@/lib/estadisticas";
import { FORMAT_LABEL, PLAYERS, type GameState, type Player } from "@/lib/types";

/**
 * Resumen de la partida por jugador, desglosado por formato y por categoría.
 * Se enseña al agotarse el banco y antes de reiniciar, que son los dos momentos
 * en los que la partida deja de estar en curso.
 *
 * Solo salen las filas con algún intento: con 7 formatos y 10 categorías, una
 * tabla de ceros taparía lo poco que se hubiera jugado.
 */
export function Estadisticas({ estado }: { estado: GameState }) {
  const stats = calcularEstadisticas(estado);
  const pasados = rebotesPasados(estado);
  const jugadas = estado.history.length;

  if (jugadas === 0) {
    return (
      <p className="text-sm text-[var(--apagado)]">
        Todavía no hay preguntas jugadas en esta partida, así que no hay nada que resumir.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(PLAYERS) as Player[]).map((jugador) => (
          <ColumnaJugador
            key={jugador}
            jugador={jugador}
            stats={stats[jugador]}
            pasados={pasados[jugador]}
          />
        ))}
      </div>

      <p className="text-xs text-[var(--apagado)]">
        Los rebotes cuentan como un intento más de quien los jugó. Pasar no cuenta, porque
        no llegó a responderse.
      </p>
    </div>
  );
}

function ColumnaJugador({
  jugador,
  stats,
  pasados,
}: {
  jugador: Player;
  stats: ReturnType<typeof calcularEstadisticas>[Player];
  pasados: number;
}) {
  const total = stats.total;
  const pct = porcentaje(total);

  return (
    <section
      data-jugador={jugador}
      className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] p-4"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h4 className="font-medium" style={{ color: "var(--jugador)" }}>
          {PLAYERS[jugador].emoji} {PLAYERS[jugador].nombre}
        </h4>
        <span className="text-sm text-[var(--apagado)]">
          {intentos(total) === 0 ? "sin intentos" : `${total.aciertos} de ${intentos(total)}`}
          {pct !== null && ` · ${pct} %`}
        </span>
      </header>

      {intentos(total) === 0 ? (
        <p className="mt-3 text-sm text-[var(--apagado)]">No ha respondido a nada todavía.</p>
      ) : (
        <>
          <Bloque titulo="Por formato">
            {filas(stats.porFormato).map(({ clave, recuento }) => (
              <Fila key={clave} etiqueta={FORMAT_LABEL[clave]} recuento={recuento} />
            ))}
          </Bloque>

          <Bloque titulo="Por categoría">
            {filas(stats.porCategoria).map(({ clave, recuento }) => (
              <Fila key={clave} etiqueta={clave} recuento={recuento} />
            ))}
          </Bloque>
        </>
      )}

      {pasados > 0 && (
        <p className="mt-3 text-xs text-[var(--apagado)]">
          Ha pasado {pasados} {pasados === 1 ? "rebote" : "rebotes"}.
        </p>
      )}
    </section>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h5 className="text-xs uppercase tracking-wide text-[var(--apagado)]">{titulo}</h5>
      <dl className="mt-2 flex flex-col gap-1.5">{children}</dl>
    </div>
  );
}

function Fila({ etiqueta, recuento }: { etiqueta: string; recuento: Recuento }) {
  const n = intentos(recuento);
  const pct = porcentaje(recuento) ?? 0;

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
      <dt className="truncate">{etiqueta}</dt>
      <dd className="tabular-nums text-[var(--apagado)]">
        <span className="text-[var(--acierto)]">{recuento.aciertos}</span>
        <span aria-hidden> / </span>
        <span className="sr-only"> aciertos de </span>
        {n}
      </dd>
      {/* La barra repite el dato de al lado, pero de un vistazo se ve dónde
          flojea cada uno sin tener que comparar fracciones mentalmente. */}
      <div
        className="col-span-2 h-1 overflow-hidden rounded-full bg-[var(--borde)]"
        role="presentation"
      >
        <div className="h-full rounded-full bg-[var(--acierto)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
