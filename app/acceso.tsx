"use client";

import { useActionState } from "react";
import { entrar, type EstadoAcceso } from "./acciones";

const INICIAL: EstadoAcceso = { error: null };

/**
 * Pantalla del PIN. Se escribe una vez por dispositivo: la cookie dura un año,
 * así que Alicia lo teclea el primer día y ya está.
 */
export function Acceso() {
  const [estado, accion, pendiente] = useActionState(entrar, INICIAL);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-medium">Trivial de animación</h1>
        <p className="text-sm text-[var(--apagado)]">
          Escribe el PIN para entrar en la partida.
        </p>
      </header>

      <form
        action={accion}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--borde)]
          bg-[var(--superficie)] p-5"
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm text-[var(--apagado)]">PIN</span>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            autoFocus
            aria-invalid={estado.error ? "true" : undefined}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-4 py-3
              text-lg tracking-[0.3em] outline-none focus:border-[var(--oscar)]"
          />
        </label>

        {estado.error && (
          <p className="text-sm text-[var(--fallo)]" role="alert">
            {estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="rounded-xl bg-[var(--oscar)] px-5 py-3 font-medium text-[#0b0c10]
            transition hover:brightness-110 disabled:opacity-60"
        >
          {pendiente ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
