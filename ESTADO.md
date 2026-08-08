# Estado del proyecto — Trivial de animación

Documento de contexto para retomar el trabajo sin depender del historial de chat.
Última actualización: 6 de agosto de 2026.

## Qué es

Web para que Oscar y Alicia jueguen a un trivial de películas y series de
animación. Sustituye a una partida que venían jugando con ChatGPT, con marcador
59-57 y 82 preguntas respondidas cada uno.

El punto de partida fue un prompt de ChatGPT con las reglas del juego. La web
implementa esas reglas como código, no como instrucciones a un modelo: no hay
ninguna llamada a IA en tiempo de ejecución.

## Decisiones tomadas (y por qué)

| Decisión | Elegido | Motivo |
| --- | --- | --- |
| Origen de las preguntas | Banco local en TypeScript | Coste cero, sin alucinaciones, sin internet, respuesta instantánea |
| Corrección de respuestas | Normalización + esqueleto consonántico | Acepta erratas como «Bemax» sin colar «Nana» por «Nala» |
| Modo de juego | Un solo dispositivo, por turnos | Juegan juntos; nada de sincronización en tiempo real |
| Persistencia | Supabase (Postgres) | Oscar quiere abrir la partida desde cualquier sitio |
| Ubicación | Proyecto nuevo, hermano de `tienda_de_ropa` | No mezclar con la landing VANTA |
| Árbitro | Botón «Era correcta, dadle el punto» | El corrector automático puede fallar; sin registro de usos |
| Tamaño del banco | ~150 objetivo, salieron 220 | Ampliable añadiendo líneas a `lib/banco/` |

## Stack

- Next.js 16.3.0 (App Router, Server Actions), React 19.2.8, TypeScript, Tailwind 4.
- `@supabase/supabase-js` + `server-only`.
- `tsx` para los scripts de verificación.
- Node 20.19.4, Windows.

**Importante:** este Next.js tiene cambios respecto a lo que un modelo suele
recordar. `AGENTS.md` obliga a consultar `node_modules/next/dist/docs/` antes de
escribir código. Dos cosas ya comprobadas ahí:

- `export const dynamic = "force-dynamic"` sigue existiendo, pero lo idiomático
  ahora es `await connection()` de `next/server`. Es lo que usa `app/page.tsx`.
- El tipo de props del layout es `LayoutProps<"/">`, global, no hay que importarlo.

## Reglas del juego implementadas

1. Turnos estrictos: Oscar → Alicia. Oscar siempre abre ronda.
2. Una pregunta cada vez, esperando respuesta.
3. Acierto = 1 punto. Fallo = 0. No hay medios puntos.
4. En preguntas de varias respuestas hay que acertarlas todas (`accepted` con
   varios huecos obligatorios).
5. Pregunta anulada: no toca el marcador, no hace perder el turno, sirve otra al
   mismo jugador. Botón «Anular pregunta».
6. «Esa ya ha salido»: mismo comportamiento. Botón propio.
7. Erratas y aproximaciones fonéticas se aceptan indicando la grafía oficial.
8. Se muestra siempre la respuesta oficial tras contestar, más una nota breve
   opcional.
9. Solo marcador numérico, sin cadenas de aciertos y fallos.
10. Nombres y títulos del doblaje de España.

### Variedad

- Una franquicia no se repite hasta pasadas 8 preguntas.
- Nunca la misma franquicia para los dos dentro de una ronda.
- Ningún formato más de 2 veces seguidas.
- Dificultad sorteada **por ronda** (60 % fácil / 30 % media / 10 % difícil), así
  Oscar y Alicia juegan siempre al mismo nivel.
- Las preguntas difíciles son siempre de elección múltiple.

### Conflicto de reglas resuelto

«Las difíciles son de elección múltiple» y «ningún formato tres veces seguidas»
son incompatibles cuando caen dos rondas difíciles juntas. Se resuelve en el
sorteo: si la última pregunta fue de opciones, la ronda no puede ser difícil.
Está en `sortearDificultad(permitirDificil)` en `lib/motor.ts`.

## Mapa de ficheros

```
lib/types.ts             Question (unión por formato), GameState, HistoryEntry
lib/corrector.ts         normalizar, levenshtein, esqueleto, corregirTexto
lib/motor.ts             elegirPregunta, servirPregunta, responder,
                         descartarPregunta, concederPunto, partidaNueva
lib/barajar.ts           Barajado determinista por semilla (evita mismatch de hidratación)
lib/preguntas.ts         Índice del banco, porId, validarBanco, PREGUNTA_PENDIENTE
lib/banco/disney.ts      Clásicos Disney y WDAS
lib/banco/estudios.ts    Pixar, DreamWorks, Illumination, Sony y otros
lib/banco/series.ts      TV, Ghibli, anime, Clan y Boing
lib/partida-guardada.ts  Estado semilla 59-57 con la pregunta 83 pendiente
lib/supabase.ts          Cliente con service role key, marcado server-only
app/acciones.ts          Server Actions: cargarPartida, guardarPartida
app/page.tsx             Server Component: lee el estado o enseña la pantalla de configuración
app/juego.tsx            Cliente: marcador, pregunta, veredicto, pie
app/respuesta.tsx        Entrada de respuesta según el formato
app/globals.css          Variables de color y tema por jugador
supabase/esquema.sql     Tabla partidas + RLS
scripts/*.ts             Verificación (ver abajo)
```

## Formato de una pregunta

```ts
{
  id: "reyleon-pumba",          // único en todo el banco
  franchise: "El Rey León",     // clave del bloqueo de 8 preguntas
  emoji: "🦁",
  difficulty: "facil",          // facil | media | dificil
  format: "corta",              // corta | multiple | vf | orden | relacionar | describir | completar
  prompt: "¿Cómo se llama el jabalí verrugoso que acompaña a Timón?",
  hint: "(Solo el nombre.)",    // opcional
  accepted: [["Pumba", "Pumbaa"]], // lista de huecos; cada hueco, sus variantes
  official: "Pumba",            // grafía que se muestra al revelar
  note: "…",                    // opcional, una línea como máximo
}
```

Según el formato cambian los campos de respuesta: `multiple` usa
`options` + `correct` (**la correcta va siempre en el índice 0**, la interfaz las
baraja), `vf` usa `correct: boolean`, `orden` usa `items` en el orden correcto y
`relacionar` usa `pairs: {left, right}[]`.

## Cómo funciona el corrector

Dos vías para dar por buena una respuesta que no es idéntica:

1. **Levenshtein** con tolerancia por longitud (0 hasta 6 caracteres, 1 hasta 10,
   2 por encima). Caza resbalones de teclado en nombres largos: «Rapuzel».
2. **Esqueleto consonántico**: quita vocales y h muda, unifica c/k/q, v/b y z/s, y
   aplasta letras dobles. «Baymax» y «Bemax» dan `bmx`; «Manny» y «Mani» dan `mn`.
   Esto es lo que separa una errata de otro personaje: «Nala» da `nl` y «Nana» da
   `n`, así que no se confunden aunque solo cambie una letra.

La distancia de edición sola no servía: «Mani»/Manny está a distancia 2 y debe
valer, mientras que «Nala»/Nana está a distancia 1 y debe fallar.

## Verificación

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run validar     # estructura y reparto del banco
npm run probar      # 25 casos del corrector, incluidos los 6 del enunciado
npm run simular     # juega una partida entera y comprueba las reglas
```

Estado actual de cada uno:

- `typecheck` y `lint`: limpios.
- `validar`: 220 preguntas, 130 franquicias, reparto 62 % / 27 % / 11 %.
- `probar`: los 25 casos pasan.
- `simular`: las reglas se cumplen durante las ~180 primeras preguntas. En las
  últimas ~35 aparecen repeticiones de formato porque el banco se queda sin
  alternativas; es inevitable y se arregla añadiendo preguntas.

### Verificado en el navegador

Con `TRIVIAL_SIN_NUBE=1` se jugaron cuatro turnos reales y funcionó todo:

- Carga la partida guardada: 59-57, turno de Oscar, pregunta 83 de Megamind.
- «roxane richi» se acepta como Roxanne Ritchi, avisa de la errata y suma punto.
- El turno pasa a Alicia con una franquicia distinta y la misma dificultad.
- Una respuesta fallada muestra la correcta; «Era correcta» sube 57 a 58.
- «Anular pregunta» mantiene jugador y número, y sirve otra pregunta que además
  respeta el veto de formato.
- Consola del navegador limpia; en el servidor solo los errores esperados de
  Supabase sin claves.

### Modo sin nube

`TRIVIAL_SIN_NUBE=1` en `.env.local` hace que, si Supabase falla, la web juegue
en local desde el estado semilla en vez de enseñar la pantalla de configuración.
**No guarda nada y se reinicia al recargar.** Es solo para probar la interfaz;
en cuanto haya claves reales deja de activarse, porque la carga ya no falla.

## Pendiente

1. **Bloqueante — Supabase.** Oscar tiene que crear el proyecto en supabase.com,
   ejecutar `supabase/esquema.sql` en el SQL Editor y copiar
   `.env.local.example` a `.env.local` con la URL y la *service role key*. Sin
   eso la web arranca pero solo enseña la pantalla de configuración.
2. **Probar los formatos que faltan.** Se han visto en el navegador `corta` y
   `multiple`. Quedan por ejercitar `vf`, `orden`, `relacionar`, `describir` y
   `completar`, y la pantalla de banco agotado.
3. **Desplegar en Vercel** con las dos variables de entorno.
4. **README** breve.
5. Commit: nada de esto está commiteado todavía, solo el scaffold inicial.

## Ideas descartadas o aplazadas

- Generar preguntas con la API de Claude en vivo: descartado por coste y riesgo
  de datos inventados.
- Registro de cuántas veces usa cada uno el botón «era correcta»: el campo
  `overrides` existe en el estado pero no se muestra, por decisión de Oscar.
- Sala compartida entre dos dispositivos: no hace falta, juegan juntos.

## Notas sueltas

- El acceso a la base de datos va solo por Server Actions con la service role
  key. La tabla tiene RLS activado y **ninguna política**, así que la clave
  pública no sirve para nada. La anon key no se usa en ningún sitio.
- Las Server Actions son invocables por POST por cualquiera que conozca la URL
  del despliegue. Para una partida privada entre dos es aceptable; si molesta,
  se puede añadir un PIN compartido.
- El estado de la partida cabe entero en una fila jsonb con id `oscar-alicia`.
- Los ~130 datos del registro de preguntas ya usadas del prompt original están
  excluidos del banco: ninguna pregunta los repite.
