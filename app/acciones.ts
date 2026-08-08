"use server";

import { abrirSesion, exigirSesion } from "@/lib/acceso";
import { partidaGuardada } from "@/lib/partida-guardada";
import { PARTIDA_ID, supabaseServidor } from "@/lib/supabase";
import type { GameState } from "@/lib/types";

/** Lo que la pantalla del PIN necesita saber del último intento. */
export type EstadoAcceso = { error: string | null };

/**
 * Comprueba el PIN y deja la sesión abierta en este navegador. El retardo del
 * fallo es a propósito: sin él, un PIN de seis cifras se prueba entero.
 */
export async function entrar(
  _previo: EstadoAcceso,
  datos: FormData,
): Promise<EstadoAcceso> {
  const intento = String(datos.get("pin") ?? "");

  if (!intento.trim()) return { error: "Escribe el PIN." };

  if (!(await abrirSesion(intento))) {
    await new Promise((listo) => setTimeout(listo, 600));
    return { error: "PIN incorrecto." };
  }

  return { error: null };
}

/**
 * Devuelve la partida en curso. Si la tabla está vacía siembra la partida que
 * venía de ChatGPT (59-57, pregunta 83 de Oscar pendiente) y la guarda.
 */
export async function cargarPartida(): Promise<GameState> {
  await exigirSesion();
  const supabase = supabaseServidor();

  const { data, error } = await supabase
    .from("partidas")
    .select("estado")
    .eq("id", PARTIDA_ID)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la partida: ${error.message}`);
  if (data) return data.estado as GameState;

  const inicial = partidaGuardada();
  await guardarPartida(inicial);
  return inicial;
}

export async function guardarPartida(estado: GameState): Promise<void> {
  await exigirSesion();
  const supabase = supabaseServidor();

  const { error } = await supabase
    .from("partidas")
    .upsert({ id: PARTIDA_ID, estado, actualizado: new Date().toISOString() });

  if (error) throw new Error(`No se pudo guardar la partida: ${error.message}`);
}
