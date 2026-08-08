import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la service role key. Solo puede importarse desde el
 * servidor: `server-only` hace fallar la compilación si alguien lo arrastra a
 * un componente de cliente, que es justo lo que no queremos que pase con esta
 * clave.
 */
export function supabaseServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !clave) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }

  return createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Id de la fila donde vive vuestra partida. */
export const PARTIDA_ID = "oscar-alicia";
