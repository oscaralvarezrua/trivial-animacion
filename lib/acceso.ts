import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * PIN compartido. Existe porque las Server Actions se pueden invocar por POST
 * desde fuera: no basta con esconder la pantalla, hay que comprobar el acceso
 * en cada acción, que es donde está el dato.
 */

export const COOKIE_ACCESO = "trivial_acceso";

/** Un año: la idea es escribirlo una vez por dispositivo y olvidarse. */
const DURACION = 60 * 60 * 24 * 365;

/**
 * Sin `TRIVIAL_PIN` configurado la web queda abierta, como estaba antes. Se
 * prefiere eso a fallar cerrado: quedarse fuera de vuestra propia partida por
 * una variable de entorno mal puesta es peor que el riesgo que cubre el PIN.
 */
export function pinExigido(): boolean {
  return Boolean(process.env.TRIVIAL_PIN);
}

/**
 * Lo que se guarda en la cookie no es el PIN, sino un hash con sal. Así el
 * secreto no viaja en cada petición ni queda escrito en el navegador.
 */
function testigo(pin: string): string {
  return createHash("sha256").update(`trivial-animacion:${pin}`).digest("hex");
}

/**
 * Comparación en tiempo constante. Se hashean los dos lados antes para que
 * siempre midan 32 bytes: si no, la duración de la comparación delataría la
 * longitud del PIN.
 */
function iguales(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

/** Memoizado con `cache`: la página y la acción lo preguntan en la misma pasada. */
export const haySesion = cache(async (): Promise<boolean> => {
  const pin = process.env.TRIVIAL_PIN;
  if (!pin) return true;

  const cookie = (await cookies()).get(COOKIE_ACCESO)?.value;
  return Boolean(cookie && iguales(cookie, testigo(pin)));
});

/** Para las Server Actions: corta antes de tocar Supabase. */
export async function exigirSesion(): Promise<void> {
  if (!(await haySesion())) {
    throw new Error("Sesión no válida: vuelve a introducir el PIN.");
  }
}

/**
 * Valida un intento y, si vale, deja la cookie puesta. Devuelve si acertó.
 * Solo puede llamarse desde una Server Action: escribir cookies durante el
 * render de un Server Component no está permitido.
 */
export async function abrirSesion(intento: string): Promise<boolean> {
  const pin = process.env.TRIVIAL_PIN;
  if (!pin) return true;

  if (!iguales(intento.trim(), pin)) return false;

  (await cookies()).set(COOKIE_ACCESO, testigo(pin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION,
  });

  return true;
}
