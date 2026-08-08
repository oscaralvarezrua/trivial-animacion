"use client";

import { useMemo, useState } from "react";
import { barajar } from "@/lib/barajar";
import { corregirTexto } from "@/lib/corrector";
import type { Question } from "@/lib/types";

export interface Envio {
  /** Lo que respondió el jugador, en texto, para el historial. */
  texto: string;
  acierto: boolean;
  /** Acertó pero escribiéndolo mal: hay que citarle la grafía oficial. */
  conErrata: boolean;
}

const BOTON =
  "rounded-xl border border-[var(--borde)] px-4 py-3 text-left transition " +
  "hover:border-[var(--jugador)] hover:bg-[var(--jugador-suave)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--jugador)]";

const PRINCIPAL =
  "rounded-xl bg-[var(--jugador)] px-5 py-3 font-medium text-[#0b0c10] transition " +
  "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40";

export function EntradaRespuesta({
  pregunta,
  onEnviar,
}: {
  pregunta: Question;
  onEnviar: (envio: Envio) => void;
}) {
  switch (pregunta.format) {
    case "corta":
    case "describir":
    case "completar":
      return <Texto pregunta={pregunta} onEnviar={onEnviar} />;
    case "multiple":
      return <Opciones pregunta={pregunta} onEnviar={onEnviar} />;
    case "vf":
      return <VerdaderoFalso pregunta={pregunta} onEnviar={onEnviar} />;
    case "orden":
      return <Orden pregunta={pregunta} onEnviar={onEnviar} />;
    case "relacionar":
      return <Relacionar pregunta={pregunta} onEnviar={onEnviar} />;
  }
}

type Props<T extends Question> = { pregunta: T; onEnviar: (envio: Envio) => void };

function Texto({
  pregunta,
  onEnviar,
}: Props<Extract<Question, { format: "corta" | "describir" | "completar" }>>) {
  const [valor, setValor] = useState("");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valor.trim()) return;
        const { acierto, conErrata } = corregirTexto(valor, pregunta.accepted);
        onEnviar({ texto: valor.trim(), acierto, conErrata });
      }}
    >
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Escribe tu respuesta"
        aria-label="Tu respuesta"
        className="flex-1 rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-4 py-3
          outline-none placeholder:text-[var(--apagado)] focus:border-[var(--jugador)]"
      />
      <button type="submit" className={PRINCIPAL} disabled={!valor.trim()}>
        Responder
      </button>
    </form>
  );
}

function Opciones({
  pregunta,
  onEnviar,
}: Props<Extract<Question, { format: "multiple" }>>) {
  // En el banco la correcta siempre va la primera, así que hay que mezclarlas.
  const opciones = useMemo(
    () => barajar(pregunta.options.map((texto, i) => ({ texto, i })), pregunta.id),
    [pregunta.id, pregunta.options],
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opciones.map(({ texto, i }, posicion) => (
        <button
          key={texto}
          className={BOTON}
          onClick={() =>
            onEnviar({ texto, acierto: i === pregunta.correct, conErrata: false })
          }
        >
          <span className="mr-2 font-mono text-[var(--apagado)]">
            {String.fromCharCode(97 + posicion)})
          </span>
          {texto}
        </button>
      ))}
    </div>
  );
}

function VerdaderoFalso({
  pregunta,
  onEnviar,
}: Props<Extract<Question, { format: "vf" }>>) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[true, false].map((valor) => (
        <button
          key={String(valor)}
          className={`${BOTON} text-center`}
          onClick={() =>
            onEnviar({
              texto: valor ? "Verdadero" : "Falso",
              acierto: valor === pregunta.correct,
              conErrata: false,
            })
          }
        >
          {valor ? "Verdadero" : "Falso"}
        </button>
      ))}
    </div>
  );
}

function Orden({ pregunta, onEnviar }: Props<Extract<Question, { format: "orden" }>>) {
  const mezclados = useMemo(
    () => barajar(pregunta.items, pregunta.id),
    [pregunta.id, pregunta.items],
  );
  const [elegidos, setElegidos] = useState<string[]>([]);

  const pendientes = mezclados.filter((item) => !elegidos.includes(item));
  const completo = elegidos.length === pregunta.items.length;

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2">
        {pregunta.items.map((_, posicion) => {
          const elegido = elegidos[posicion];
          return (
            <li
              key={posicion}
              className="flex items-center gap-3 rounded-xl border border-dashed
                border-[var(--borde)] px-4 py-2.5"
            >
              <span className="font-mono text-[var(--apagado)]">{posicion + 1}.</span>
              <span className={elegido ? "" : "text-[var(--apagado)]"}>
                {elegido ?? "—"}
              </span>
            </li>
          );
        })}
      </ol>

      {pendientes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendientes.map((item) => (
            <button
              key={item}
              className={`${BOTON} py-2 text-sm`}
              onClick={() => setElegidos([...elegidos, item])}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          className={PRINCIPAL}
          disabled={!completo}
          onClick={() =>
            onEnviar({
              texto: elegidos.join(" → "),
              acierto: elegidos.every((item, i) => item === pregunta.items[i]),
              conErrata: false,
            })
          }
        >
          Confirmar orden
        </button>
        {elegidos.length > 0 && (
          <button
            className="rounded-xl px-4 py-3 text-sm text-[var(--apagado)] hover:text-[var(--texto)]"
            onClick={() => setElegidos(elegidos.slice(0, -1))}
          >
            Deshacer
          </button>
        )}
      </div>
    </div>
  );
}

function Relacionar({
  pregunta,
  onEnviar,
}: Props<Extract<Question, { format: "relacionar" }>>) {
  const derechas = useMemo(
    () => barajar(pregunta.pairs.map((p) => p.right), pregunta.id),
    [pregunta.id, pregunta.pairs],
  );
  const [elegido, setElegido] = useState<Record<string, string>>({});

  const completo = pregunta.pairs.every((p) => elegido[p.left]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {pregunta.pairs.map((par) => (
          <label key={par.left} className="flex flex-wrap items-center gap-3">
            <span className="min-w-32 flex-1 font-medium">{par.left}</span>
            <select
              value={elegido[par.left] ?? ""}
              onChange={(e) =>
                setElegido({ ...elegido, [par.left]: e.target.value })
              }
              className="flex-1 rounded-xl border border-[var(--borde)] bg-[var(--fondo)]
                px-3 py-2.5 outline-none focus:border-[var(--jugador)]"
            >
              <option value="">Elige…</option>
              {derechas.map((derecha) => (
                <option key={derecha} value={derecha}>
                  {derecha}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <button
        className={PRINCIPAL}
        disabled={!completo}
        onClick={() =>
          onEnviar({
            texto: pregunta.pairs
              .map((p) => `${p.left}–${elegido[p.left]}`)
              .join(", "),
            acierto: pregunta.pairs.every((p) => elegido[p.left] === p.right),
            conErrata: false,
          })
        }
      >
        Comprobar
      </button>
    </div>
  );
}
