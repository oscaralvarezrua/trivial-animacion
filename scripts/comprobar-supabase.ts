import { createClient } from "@supabase/supabase-js";

/**
 * Comprueba que Supabase está bien conectado: claves presentes, proyecto
 * accesible y tabla creada. No imprime nunca el valor de las claves.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fallo(mensaje: string, ayuda?: string): never {
  console.log(`✗ ${mensaje}`);
  if (ayuda) console.log(`  ${ayuda}`);
  process.exit(1);
}

if (!url) fallo("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
if (!clave) fallo("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  fallo(
    `La URL no tiene la pinta esperada: ${url}`,
    "Debe ser algo como https://abcdefghijkl.supabase.co, sin barra final ni rutas.",
  );
}

// La anon key es la pública y no sirve: el RLS de la tabla la bloquea entera.
// Se distinguen por el campo "role" del JWT.
try {
  const cuerpo = JSON.parse(
    Buffer.from(clave.split(".")[1] ?? "", "base64").toString("utf8"),
  );
  if (cuerpo.role === "anon") {
    fallo(
      "Has puesto la anon key, no la service role key",
      "En Supabase: Project Settings → API Keys → service_role (la que está oculta).",
    );
  }
} catch {
  // Las claves nuevas de Supabase (sb_secret_…) no son JWT; no se puede mirar dentro.
}

async function comprobar() {
  const supabase = createClient(url!, clave!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error, count } = await supabase
    .from("partidas")
    .select("id", { count: "exact", head: true });

  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message)) {
      fallo(
        "Conecta con el proyecto, pero la tabla «partidas» no existe",
        "Ejecuta el contenido de supabase/esquema.sql en el SQL Editor de Supabase.",
      );
    }
    fallo(`No se puede consultar la tabla: ${error.message}`);
  }

  console.log("✓ Claves correctas");
  console.log("✓ Proyecto accesible");
  console.log(`✓ Tabla «partidas» creada (${count ?? 0} partidas guardadas)`);
  console.log("\nTodo listo. Quita TRIVIAL_SIN_NUBE de .env.local y arranca el servidor.");
}

comprobar().catch((e) => fallo(e instanceof Error ? e.message : String(e)));
