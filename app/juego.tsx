"use client";

import { useState, useTransition } from "react";
import { guardarPartida } from "./acciones";
import { EntradaRespuesta, type Envio } from "./respuesta";
import {
  concederPunto,
  descartarPregunta,
  partidaNueva,
  responder,
  servirPregunta,
} from "@/lib/motor";
import { porId } from "@/lib/preguntas";
import { FORMAT_LABEL, PLAYERS, type GameState, type Player } from "@/lib/types";

export function Juego({ estadoInicial }: { estadoInicial: GameState }) {
  const [estado, setEstado] = useState(estadoInicial);
  const [errata, setErrata] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <Marcador estado={estado} />

      {pregunta ? (
        <section
          key={pregunta.id}
          data-jugador={estado.turn}
          className="aparecer flex flex-col gap-5 rounded-2xl border border-[var(--borde)]
            bg-[var(--superficie)] p-5 sm:p-6"
        >
          <header className="flex flex-col gap-1">
            <p className="text-sm text-[var(--apagado)]">
              <span style={{ color: "var(--jugador)" }}>
                {PLAYERS[estado.turn].emoji} Pregunta {estado.nextNumber[estado.turn]}
              </span>
              {" — "}
              {FORMAT_LABEL[pregunta.format]}
            </p>
            <p className="text-sm text-[var(--apagado)]">
              {pregunta.emoji} {pregunta.franchise}
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

          <EntradaRespuesta pregunta={pregunta} onEnviar={alResponder} />

          <footer className="flex flex-wrap gap-4 border-t border-[var(--borde)] pt-4 text-sm">
            <button
              className="text-[var(--apagado)] underline-offset-4 hover:text-[var(--texto)] hover:underline"
              onClick={() => aplicar(descartarPregunta(estado))}
            >
              Esta ya ha salido
            </button>
            <button
              className="text-[var(--apagado)] underline-offset-4 hover:text-[var(--texto)] hover:underline"
              onClick={() => aplicar(descartarPregunta(estado))}
            >
              Anular pregunta
            </button>
            <span className="ml-auto text-[var(--apagado)]">
              Sin penalización, repite {PLAYERS[estado.turn].nombre}
            </span>
          </footer>
        </section>
      ) : ultima ? (
        <Veredicto
          estado={estado}
          errata={errata}
          onConceder={() => {
            setErrata(false);
            aplicar(concederPunto(estado));
          }}
          onSiguiente={() => {
            setErrata(false);
            aplicar(servirPregunta(estado));
          }}
        />
      ) : (
        <Agotado onReiniciar={() => aplicar(partidaNueva())} />
      )}

      <Pie estado={estado} fallo={fallo} onReiniciar={() => aplicar(partidaNueva())} />
    </main>
  );
}

function Marcador({ estado }: { estado: GameState }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(Object.keys(PLAYERS) as Player[]).map((jugador) => {
        const activo = estado.turn === jugador;
        return (
          <div
            key={jugador}
            data-jugador={jugador}
            aria-current={activo ? "true" : undefined}
            className={`rounded-2xl border p-4 transition ${
              activo
                ? "border-[var(--jugador)] bg-[var(--jugador-suave)]"
                : "border-[var(--borde)] bg-[var(--superficie)]"
            }`}
          >
            <p className="text-sm text-[var(--apagado)]">
              {PLAYERS[jugador].emoji} {PLAYERS[jugador].nombre}
            </p>
            <p
              className="text-4xl font-semibold tabular-nums"
              style={{ color: activo ? "var(--jugador)" : undefined }}
            >
              {estado.scores[jugador]}
            </p>
            {activo && (
              <p className="text-xs" style={{ color: "var(--jugador)" }}>
                Su turno
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Veredicto({
  estado,
  errata,
  onConceder,
  onSiguiente,
}: {
  estado: GameState;
  errata: boolean;
  onConceder: () => void;
  onSiguiente: () => void;
}) {
  const ultima = estado.history.at(-1)!;
  const pregunta = porId(ultima.questionId);
  const jugador = PLAYERS[ultima.player];

  return (
    <section
      data-jugador={ultima.player}
      className="aparecer flex flex-col gap-5 rounded-2xl border border-[var(--borde)]
        bg-[var(--superficie)] p-5 sm:p-6"
    >
      <p
        className="text-xl font-semibold"
        style={{ color: ultima.correct ? "var(--acierto)" : "var(--fallo)" }}
      >
        {ultima.correct ? "✅ ¡Correcto!" : "❌ Incorrecto"}
      </p>

      <div className="flex flex-col gap-1.5">
        <p className="text-lg">
          La respuesta {ultima.correct ? "era" : "correcta era"}{" "}
          <strong>{pregunta?.official}</strong>.
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

        {!ultima.correct && (
          <button
            onClick={onConceder}
            className="text-sm text-[var(--apagado)] underline-offset-4
              hover:text-[var(--texto)] hover:underline"
          >
            Era correcta, dadle el punto
          </button>
        )}
      </div>
    </section>
  );
}

function Agotado({ onReiniciar }: { onReiniciar: () => void }) {
  return (
    <section className="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-6">
      <h2 className="text-xl font-medium">Se ha acabado el banco de preguntas</h2>
      <p className="mt-2 text-[var(--apagado)]">
        Habéis jugado todas. Añade más en <code>lib/banco/</code> o empieza una partida
        nueva para volver a usarlas.
      </p>
      <button
        onClick={onReiniciar}
        className="mt-4 rounded-xl border border-[var(--borde)] px-4 py-2.5 hover:border-[var(--texto)]"
      >
        Partida nueva
      </button>
    </section>
  );
}

function Pie({
  estado,
  fallo,
  onReiniciar,
}: {
  estado: GameState;
  fallo: string | null;
  onReiniciar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <footer className="mt-auto flex flex-col gap-3 pt-4 text-sm text-[var(--apagado)]">
      {fallo && (
        <p className="rounded-xl border border-[var(--fallo)] px-4 py-2.5 text-[var(--fallo)]">
          No se ha guardado en la nube: {fallo}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span>
          {estado.usedQuestionIds.length}{" "}
          {estado.usedQuestionIds.length === 1 ? "pregunta usada" : "preguntas usadas"}
        </span>
        <span aria-hidden>·</span>
        {confirmando ? (
          <>
            <span>¿Seguro? Se pierde el 59-57 y todo el historial.</span>
            <button
              onClick={() => {
                setConfirmando(false);
                onReiniciar();
              }}
              className="text-[var(--fallo)] underline underline-offset-4"
            >
              Sí, reiniciar
            </button>
            <button onClick={() => setConfirmando(false)} className="underline underline-offset-4">
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="underline-offset-4 hover:text-[var(--texto)] hover:underline"
          >
            Reiniciar partida
          </button>
        )}
      </div>
    </footer>
  );
}
