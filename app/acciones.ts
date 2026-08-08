"use server";

import { partidaGuardada } from "@/lib/partida-guardada";
import { PARTIDA_ID, supabaseServidor } from "@/lib/supabase";
import type { GameState } from "@/lib/types";

/**
 * Devuelve la partida en curso. Si la tabla está vacía siembra la partida que
 * venía de ChatGPT (59-57, pregunta 83 de Oscar pendiente) y la guarda.
 */
export async function cargarPartida(): Promise<GameState> {
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
  const supabase = supabaseServidor();

  const { error } = await supabase
    .from("partidas")
    .upsert({ id: PARTIDA_ID, estado, actualizado: new Date().toISOString() });

  if (error) throw new Error(`No se pudo guardar la partida: ${error.message}`);
}
