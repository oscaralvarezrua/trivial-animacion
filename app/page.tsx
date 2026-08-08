import { connection } from "next/server";
import { partidaGuardada } from "@/lib/partida-guardada";
import type { GameState } from "@/lib/types";
import { cargarPartida } from "./acciones";
import { Juego } from "./juego";

export default async function Page() {
  // La partida vive en Supabase y cambia en cada turno: nada que prerenderizar.
  await connection();

  // El try envuelve solo la lectura, no el JSX: si falla, casi siempre es que
  // todavía no están puestas las claves de Supabase, y conviene decirlo.
  let estado: GameState;
  try {
    estado = await cargarPartida();
  } catch (e) {
    if (process.env.TRIVIAL_SIN_NUBE !== "1") {
      return <Configuracion mensaje={e instanceof Error ? e.message : String(e)} />;
    }
    // Solo para probar la interfaz sin Supabase: la partida no se guarda.
    estado = partidaGuardada();
  }

  return <Juego estadoInicial={estado} />;
}

function Configuracion({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-10">
      <h1 className="text-2xl font-medium">Falta conectar Supabase</h1>

      <p className="rounded-xl border border-[var(--fallo)] px-4 py-3 text-sm text-[var(--fallo)]">
        {mensaje}
      </p>

      <ol className="flex list-decimal flex-col gap-3 pl-5 text-[var(--apagado)]">
        <li>
          Crea un proyecto en <strong>supabase.com</strong> (el plan gratuito sobra).
        </li>
        <li>
          En el <strong>SQL Editor</strong>, pega y ejecuta el contenido de{" "}
          <code className="text-[var(--texto)]">supabase/esquema.sql</code>.
        </li>
        <li>
          Copia <code className="text-[var(--texto)]">.env.local.example</code> a{" "}
          <code className="text-[var(--texto)]">.env.local</code> y rellena la URL del
          proyecto y la <em>service role key</em>.
        </li>
        <li>Reinicia el servidor de desarrollo.</li>
      </ol>
    </main>
  );
}
