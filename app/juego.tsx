"use client";

import { useState, useTransition } from "react";
import { guardarPartida } from "./acciones";
import { Etiqueta, Etiquetas, Panel, Puntuacion } from "./animaciones";
import { Estadisticas } from "./estadisticas";
import { EntradaRespuesta, type Envio } from "./respuesta";
import {
  concederPunto,
  corregirRebote,
  corregirTitular,
  descartarPregunta,
  jugadorRival,
  partidaNueva,
  pasarRebote,
  responder,
  responderRebote,
  servirPregunta,
} from "@/lib/motor";
import { PREGUNTAS, porId } from "@/lib/preguntas";
import {
  FORMAT_LABEL,
  PLAYERS,
  type GameState,
  type Player,
  type Question,
  type Rebound,
} from "@/lib/types";

export function Juego({ estadoInicial }: { estadoInicial: GameState }) {
  const [estado, setEstado] = useState(estadoInicial);
  const [errata, setErrata] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [reiniciando, setReiniciando] = useState(false);
  const [, empezarTransicion] = useTransition();

  /** Actualiza la pantalla ya y manda el estado a Supabase por detrás. */
  function aplicar(nuevo: GameState) {
    setEstado(nuevo);
    empezarTransicion(async () => {
      try {
        await guardarPartida(nuevo);
        setFallo(null);
      } catch (e) {
        setFallo(e instanceof Error ? e.message : "No se ha podido guardar");
      }
    });
  }

  function alResponder(envio: Envio) {
    setErrata(envio.conErrata);
    aplicar(responder(estado, envio.acierto, envio.texto));
  }

  const pregunta = estado.currentQuestionId ? porId(estado.currentQuestionId) : null;
  const ultima = estado.history.at(-1);
  const rebote = estado.rebote ?? null;

  // Reiniciar borra el historial, y con él las estadísticas. Por eso la
  // confirmación no es un «¿seguro?» a secas: enseña antes el resumen de la
  // partida, que es lo único que se va a perder de verdad.
  if (reiniciando) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
        <Categoria />
        <Marcador estado={estado} />
        <Resumen
          estado={estado}
          titulo="Antes de reiniciar"
          entradilla={
            estado.history.length === 0
              ? "Empezaréis de cero otra vez."
              : `Así va el ${estado.scores.oscar}-${estado.scores.alicia}. Al reiniciar se pierde el historial y este resumen.`
          }
          accion="Sí, reiniciar"
          onConfirmar={() => {
            setReiniciando(false);
            aplicar(partidaNueva());
          }}
          onCancelar={() => setReiniciando(false)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <Categoria />
      <Marcador estado={estado} />

      {/* Cada rama lleva su propia clave de fase para que el panel entre y salga
          al cambiar de una a otra. La del veredicto incluye el id de la pregunta:
          si no, al corregir un veredicto la clave no cambiaba y no se veía nada. */}
      <Panel id={faseActual(estado)}>
      {pregunta && rebote ? (
        <Rebote
          pregunta={pregunta}
          jugador={rebote}
          fallo={ultima?.given ?? ""}
          onResponder={(envio) => {
            setErrata(envio.conErrata);
            aplicar(responderRebote(estado, envio.acierto, envio.texto));
          }}
          onPasar={() => aplicar(pasarRebote(estado))}
          onConceder={() => {
            setErrata(false);
            aplicar(concederPunto(estado));
          }}
        />
      ) : pregunta ? (
        <section
          key={pregunta.id}
          data-jugador={estado.turn}
          className="tarjeta flex flex-col gap-5 p-5 sm:p-6"
        >
          <Etiquetas>
            <Etiqueta
              className="chip border-[var(--jugador)] font-medium"
              style={{ color: "var(--jugador)", background: "var(--jugador-suave)" }}
            >
              {PLAYERS[estado.turn].emoji} Pregunta {estado.nextNumber[estado.turn]}
            </Etiqueta>
            <Etiqueta className="chip">
              {pregunta.emoji} {pregunta.franchise}
            </Etiqueta>
            <Etiqueta className="chip ml-auto">{FORMAT_LABEL[pregunta.format]}</Etiqueta>
          </Etiquetas>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              {pregunta.prompt}
            </h2>
            {pregunta.hint && (
              <p className="text-sm text-[var(--apagado)]">{pregunta.hint}</p>
            )}
          </div>

          <EntradaRespuesta pregunta={pregunta} onEnviar={alResponder} />

          <footer className="flex flex-wrap gap-4 border-t border-[var(--borde)] pt-4 text-sm">
            <button
              className="text-[var(--apagado)] underline-offset-4 hover:text-[var(--texto)] hover:underline"
              onClick={() => aplicar(descartarPregunta(estado))}
            >
              Esta ya ha salido
            </button>
            <span className="ml-auto text-[var(--apagado)]">
              Sin penalización: {PLAYERS[estado.turn].nombre} responde otra
            </span>
          </footer>
        </section>
      ) : ultima ? (
        <Veredicto
          estado={estado}
          errata={errata}
          onCorregir={() => {
            setErrata(false);
            aplicar(corregirTitular(estado));
          }}
          onCorregirRebote={() => aplicar(corregirRebote(estado))}
          onSiguiente={() => {
            setErrata(false);
            aplicar(servirPregunta(estado));
          }}
        />
      ) : (
        <Resumen
          estado={estado}
          titulo="Se ha acabado el banco de preguntas"
          entradilla="Habéis jugado todas. Aquí está cómo ha ido; después podéis empezar otra partida y volver a usarlas."
          accion="Partida nueva"
          onConfirmar={() => aplicar(partidaNueva())}
        />
      )}
      </Panel>

      <Pie estado={estado} fallo={fallo} onPedirReinicio={() => setReiniciando(true)} />
    </main>
  );
}

/**
 * Identifica en qué punto está la partida, para que el panel sepa cuándo tiene
 * que reemplazarse. No basta con el id de la pregunta: la misma pregunta pasa
 * por servida, rebote y veredicto, y cada paso es un panel distinto.
 */
function faseActual(estado: GameState): string {
  const id = estado.currentQuestionId ?? estado.history.at(-1)?.questionId ?? "vacio";
  if (estado.currentQuestionId && estado.rebote) return `rebote:${id}`;
  if (estado.currentQuestionId) return `pregunta:${id}`;
  if (estado.history.length > 0) return `veredicto:${id}`;
  return "agotado";
}

/**
 * Cabecera de categoría. Hoy solo hay una, «Palomitas», así que va fija: montar
 * un selector para un único elemento sería trabajo tirado. Cuando existan
 * geografía, historia o arte, esto pasa a ser el menú.
 */
function Categoria() {
  return (
    <header className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium tracking-tight text-[var(--texto)]">Sabelotodo</p>
      <span className="chip">🍿 Palomitas</span>
    </header>
  );
}

function Marcador({ estado }: { estado: GameState }) {
  // Durante un rebote manda quien lo tiene, no el titular de la pregunta.
  const enJuego = estado.rebote ?? estado.turn;

  return (
    <div className="grid grid-cols-2 gap-3">
      {(Object.keys(PLAYERS) as Player[]).map((jugador) => {
        const activo = enJuego === jugador;
        return (
          <div
            key={jugador}
            data-jugador={jugador}
            aria-current={activo ? "true" : undefined}
            className={`tarjeta flex flex-col gap-0.5 p-4 transition duration-200 ${
              activo
                ? "latido border-[var(--jugador)] bg-[var(--jugador-suave)]"
                : "opacity-70"
            }`}
          >
            <p className="flex items-center gap-1.5 text-sm text-[var(--apagado)]">
              <span aria-hidden>{PLAYERS[jugador].emoji}</span>
              {PLAYERS[jugador].nombre}
            </p>
            <Puntuacion
              valor={estado.scores[jugador]}
              color={activo ? "var(--jugador)" : undefined}
            />
            {/* La altura se reserva siempre para que el marcador no dé un salto
                cada vez que cambia el turno. */}
            <p
              className="h-4 text-xs font-medium"
              style={{ color: "var(--jugador)" }}
            >
              {activo ? (estado.rebote ? "Rebote" : "Su turno") : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Rebote. La respuesta oficial sigue tapada: el rival decide a ciegas si se la
 * juega. Se le enseña lo que falló el titular porque en la mesa lo ha oído.
 */
function Rebote({
  pregunta,
  jugador,
  fallo,
  onResponder,
  onPasar,
  onConceder,
}: {
  pregunta: Question;
  jugador: Player;
  fallo: string;
  onResponder: (envio: Envio) => void;
  onPasar: () => void;
  onConceder: () => void;
}) {
  const titular = PLAYERS[jugadorRival(jugador)];

  return (
    <section
      data-jugador={jugador}
      className="tarjeta flex flex-col gap-5 border-[var(--jugador)] p-5 sm:p-6"
    >
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium" style={{ color: "var(--jugador)" }}>
          {PLAYERS[jugador].emoji} Rebote para {PLAYERS[jugador].nombre}
        </p>
        <p className="text-sm text-[var(--apagado)]">
          {titular.nombre} ha fallado{fallo && <>: respondió «{fallo}»</>}
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl leading-snug font-medium text-balance sm:text-2xl">
          {pregunta.prompt}
        </h2>
        {pregunta.hint && (
          <p className="text-sm text-[var(--apagado)]">{pregunta.hint}</p>
        )}
      </div>

      <p className="rounded-xl bg-[var(--jugador-suave)] px-4 py-2.5 text-sm">
        Si aciertas sumas 1. Si fallas restas 1. Si pasas, no pierdes nada:
        responde solo si te la sabes.
      </p>

      <EntradaRespuesta pregunta={pregunta} onEnviar={onResponder} />

      <footer className="flex flex-wrap items-center gap-4 border-t border-[var(--borde)] pt-4 text-sm">
        <button
          onClick={onPasar}
          className="rounded-xl border border-[var(--borde)] px-4 py-2.5
            hover:border-[var(--texto)]"
        >
          Paso, no me la sé
        </button>
        <button
          onClick={onConceder}
          className="text-[var(--apagado)] underline-offset-4 hover:text-[var(--texto)] hover:underline"
        >
          Era correcta, dadle el punto a {titular.nombre}
        </button>
      </footer>
    </section>
  );
}

function Veredicto({
  estado,
  errata,
  onCorregir,
  onCorregirRebote,
  onSiguiente,
}: {
  estado: GameState;
  errata: boolean;
  onCorregir: () => void;
  onCorregirRebote: () => void;
  onSiguiente: () => void;
}) {
  const ultima = estado.history.at(-1)!;
  const pregunta = porId(ultima.questionId);
  const jugador = PLAYERS[ultima.player];

  return (
    <section
      data-jugador={ultima.player}
      className="tarjeta flex flex-col gap-5 p-5 sm:p-6"
      style={{
        // Una franja de color arriba: el veredicto se lee de un vistazo desde
        // lejos, sin tener que fijarse en el texto.
        borderTop: `3px solid ${ultima.correct ? "var(--acierto)" : "var(--fallo)"}`,
        background: `linear-gradient(var(--${ultima.correct ? "acierto" : "fallo"}-suave), transparent 140px), var(--superficie)`,
      }}
    >
      <p
        className="flex items-center gap-2 text-lg font-semibold"
        style={{ color: ultima.correct ? "var(--acierto)" : "var(--fallo)" }}
      >
        <span aria-hidden>{ultima.correct ? "✅" : "❌"}</span>
        {ultima.correct ? "¡Correcto!" : "Incorrecto"}
      </p>

      <div className="flex flex-col gap-1.5">
        <p className="text-xl leading-snug text-balance">
          La respuesta {ultima.correct ? "era" : "correcta era"}{" "}
          <strong className="font-semibold">{pregunta?.official}</strong>.
        </p>
        {errata && ultima.correct && (
          <p className="text-sm text-[var(--apagado)]">
            Lo has escrito con alguna errata, pero cuenta.
          </p>
        )}
        {pregunta?.note && (
          <p className="text-sm text-[var(--apagado)]">{pregunta.note}</p>
        )}
        {!ultima.correct && (
          <p className="text-sm text-[var(--apagado)]">
            {jugador.nombre} respondió: «{ultima.given}»
          </p>
        )}
        {ultima.rebound && <Rebotado rebote={ultima.rebound} />}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--borde)] pt-4">
        <button
          autoFocus
          onClick={onSiguiente}
          className="rounded-xl bg-[var(--jugador)] px-5 py-3 font-medium text-[#0b0c10]
            transition hover:brightness-110"
          data-jugador={estado.turn}
        >
          Pregunta de {PLAYERS[estado.turn].nombre} →
        </button>

        {/* La corrección va en los dos sentidos y deshace lo que hubiera aplicado. */}
        <button
          onClick={onCorregir}
          className="text-sm text-[var(--apagado)] underline-offset-4
            hover:text-[var(--texto)] hover:underline"
        >
          {!ultima.correct
            ? `Era correcta, dadle el punto a ${jugador.nombre}`
            : pregunta?.format === "vf"
              ? `No era correcta, quitadle el punto a ${jugador.nombre}`
              : `No era correcta: quitadle el punto y que rebote`}
        </button>

        {ultima.rebound && ultima.rebound.outcome !== "pasa" && (
          <button
            onClick={onCorregirRebote}
            className="text-sm text-[var(--apagado)] underline-offset-4
              hover:text-[var(--texto)] hover:underline"
          >
            {ultima.rebound.outcome === "acierto"
              ? `El rebote no valía, quitadle el punto a ${PLAYERS[ultima.rebound.player].nombre}`
              : `El rebote sí valía, dadle el punto a ${PLAYERS[ultima.rebound.player].nombre}`}
          </button>
        )}
      </div>
    </section>
  );
}

function Rebotado({ rebote }: { rebote: Rebound }) {
  const nombre = PLAYERS[rebote.player].nombre;

  const texto =
    rebote.outcome === "acierto"
      ? `Rebote: ${nombre} lo cazó y suma un punto.`
      : rebote.outcome === "fallo"
        ? // Con el marcador a cero el fallo no resta: decir lo contrario sería mentir.
          rebote.delta === 0
          ? `Rebote: ${nombre} se lanzó y falló, pero estaba a cero y de ahí no baja.`
          : `Rebote: ${nombre} se lanzó, falló y pierde un punto.`
        : `Rebote: ${nombre} pasó. Sin cambios.`;

  const color =
    rebote.outcome === "acierto"
      ? "var(--acierto)"
      : rebote.outcome === "fallo"
        ? "var(--fallo)"
        : "var(--apagado)";

  return (
    <p className="text-sm" style={{ color }}>
      {texto}
      {rebote.outcome !== "pasa" && rebote.given && (
        <span className="text-[var(--apagado)]"> Respondió: «{rebote.given}»</span>
      )}
    </p>
  );
}

/**
 * Fin de partida: banco agotado o reinicio a punto de confirmarse. En los dos
 * casos la partida deja de estar en curso, así que es cuando toca enseñar el
 * resumen.
 */
function Resumen({
  estado,
  titulo,
  entradilla,
  accion,
  onConfirmar,
  onCancelar,
}: {
  estado: GameState;
  titulo: string;
  entradilla: string;
  accion: string;
  onConfirmar: () => void;
  onCancelar?: () => void;
}) {
  return (
    <section className="tarjeta flex flex-col gap-5 p-5 sm:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-medium">{titulo}</h2>
        <p className="text-sm text-[var(--apagado)]">{entradilla}</p>
      </header>

      <Estadisticas estado={estado} />

      <div className="flex flex-wrap gap-3 border-t border-[var(--borde)] pt-4">
        <button
          onClick={onConfirmar}
          className="rounded-xl border border-[var(--borde)] px-4 py-2.5 hover:border-[var(--texto)]"
        >
          {accion}
        </button>
        {onCancelar && (
          <button
            onClick={onCancelar}
            className="text-sm text-[var(--apagado)] underline-offset-4 hover:text-[var(--texto)] hover:underline"
          >
            Cancelar
          </button>
        )}
      </div>
    </section>
  );
}

function Pie({
  estado,
  fallo,
  onPedirReinicio,
}: {
  estado: GameState;
  fallo: string | null;
  onPedirReinicio: () => void;
}) {
  const usadas = estado.usedQuestionIds.length;
  const total = PREGUNTAS.length;

  return (
    <footer className="mt-auto flex flex-col gap-3 pt-4 text-sm text-[var(--apagado)]">
      {fallo && (
        <p className="rounded-xl border border-[var(--fallo)] px-4 py-2.5 text-[var(--fallo)]">
          No se ha guardado en la nube: {fallo}
        </p>
      )}

      {/* Barra de banco gastado. Con más de mil preguntas, «12 preguntas usadas»
          no dice nada; lo que quiere saberse es cuánto queda. */}
      <div
        className="h-1 overflow-hidden rounded-full bg-[var(--borde)]"
        role="progressbar"
        aria-valuenow={usadas}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Preguntas jugadas del banco"
      >
        <div
          className="h-full rounded-full bg-[var(--texto)] opacity-40 transition-[width] duration-500"
          style={{ width: `${Math.max(0.5, (usadas / total) * 100)}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="tabular-nums">
          {usadas} de {total} preguntas
        </span>
        <span aria-hidden>·</span>
        {/* La confirmación ya no vive aquí: al pulsar se enseña el resumen de la
            partida, que es lo que se pierde al reiniciar. */}
        <button
          onClick={onPedirReinicio}
          className="underline-offset-4 hover:text-[var(--texto)] hover:underline"
        >
          Reiniciar partida
        </button>
      </div>
    </footer>
  );
}
