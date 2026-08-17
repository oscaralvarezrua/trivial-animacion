# Estado del proyecto — Trivial de animación

Documento de contexto para retomar el trabajo sin depender del historial de chat.
Última actualización: 17 de agosto de 2026.

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
| Árbitro | Corrección en los dos sentidos desde el veredicto | El corrector automático falla en ambas direcciones; sin registro visible de usos |
| Tamaño del banco | ~150 objetivo, salieron 220 | Ampliable añadiendo líneas a `lib/banco/` |
| Acceso | PIN compartido, comprobado también dentro de cada Server Action | Esconder la pantalla no basta: las acciones se invocan por POST |

## Stack

- Next.js 16.3.0 (App Router, Server Actions), React 19.2.8, TypeScript, Tailwind 4.
- `@supabase/supabase-js` + `server-only`.
- `tsx` para los scripts de verificación.
- Node 24.x, Windows. Es lo que usa también el despliegue de Vercel.

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
3b. **Rebote.** Si el titular falla, la pregunta pasa al rival sin revelar la
   solución. Puede responder o pasar: acierto +1, fallo −1 y pasar no mueve
   nada, para que solo conteste si se la sabe. **Salvo en verdadero o falso**,
   donde no hay rebote: al quedar una sola opción, acertar sería gratis y el −1
   no disuadiría de nada. El marcador tiene suelo en cero,
   así que un fallo nunca deja a nadie en negativo. El botón «era correcta» se
   ofrece **durante** el rebote: si le dais el punto al titular, el rebote se
   cancela porque nunca hubo fallo. Una vez jugado el rebote ya no se puede
   deshacer. El rebote se anota dentro de la pregunta que lo provocó, no como
   entrada aparte, para no contar dos veces su franquicia y su formato en las
   reglas de variedad.
4. En preguntas de varias respuestas hay que acertarlas todas (`accepted` con
   varios huecos obligatorios).
5. «Esta ya ha salido»: no toca el marcador, no hace perder el turno y sirve
   otra al mismo jugador. La descartada queda marcada como usada, igual que si
   se hubiera jugado, así que no vuelve a aparecer. Es un único botón: el
   antiguo «Anular pregunta» llamaba a la misma función y se ha quitado.
6. Corrección del veredicto, en los dos sentidos. Un fallo se puede pasar a
   acierto y un acierto a fallo, porque el corrector automático se equivoca en
   ambas direcciones. Al pasar de acierto a fallo se abre el rebote (salvo en
   verdadero o falso); al pasar de fallo a acierto, el rebote que se hubiera
   jugado se deshace entero, incluidos los puntos del rival. El resultado del
   propio rebote también se puede invertir.
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
lib/types.ts             Question (unión por formato), GameState, HistoryEntry, Rebound
lib/corrector.ts         normalizar, levenshtein, esqueleto, corregirTexto
lib/motor.ts             elegirPregunta, servirPregunta, responder,
                         responderRebote, pasarRebote, descartarPregunta,
                         concederPunto, corregirTitular, corregirRebote,
                         partidaNueva, jugadorRival
lib/barajar.ts           Barajado determinista por semilla (evita mismatch de hidratación)
lib/preguntas.ts         Índice del banco, porId, validarBanco, PREGUNTA_PENDIENTE
lib/banco/disney.ts      Clásicos Disney y WDAS
lib/banco/estudios.ts    Pixar, DreamWorks, Illumination, Sony y otros
lib/banco/series.ts      TV, Ghibli, anime, Clan y Boing
lib/partida-guardada.ts  Estado semilla 59-57 con la pregunta 83 pendiente
lib/supabase.ts          Cliente con service role key, marcado server-only
lib/acceso.ts            PIN: haySesion, exigirSesion, abrirSesion (server-only)
app/acciones.ts          Server Actions: cargarPartida, guardarPartida, entrar
app/page.tsx             Server Component: PIN, luego el estado o la pantalla de configuración
app/acceso.tsx           Pantalla del PIN
app/juego.tsx            Cliente: marcador, pregunta, veredicto, rebote, banco agotado, pie
app/respuesta.tsx        Entrada de respuesta según el formato (los siete)
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
npm run supabase    # claves y tabla, sin imprimir nunca su valor
```

Estado actual de cada uno, comprobado el 17 de agosto de 2026:

- `typecheck` y `lint`: limpios.
- `validar`: 220 preguntas, 130 franquicias, reparto 62 % / 27 % / 11 %.
- `probar`: los 25 casos pasan.
- `simular`: pasa. Comprueba a mano el veto del rebote en las 6 preguntas de
  verdadero o falso y los cinco casos de corrección del veredicto, y luego juega
  una partida entera.

El `simular` solo exige las reglas de variedad sobre el 85 % inicial del banco
(`MARGEN` en el script). Al final ya no hay entre qué elegir y el motor tiene
que relajar filtros, así que se admite ruido. En la última tirada: 1 franquicia
repetida antes de tiempo sobre un tope de 9, y 11 rondas con dificultad desigual
sobre un tope de 14.

Esas rondas desiguales no son un fallo suelto: cuando al banco se le acaban las
preguntas de la dificultad sorteada, `elegirPregunta` cede en la dificultad
antes que en el formato, y Alicia acaba con una distinta a la de Oscar. Se
arregla añadiendo preguntas, no tocando el motor.

### Verificado en el navegador

Con `TRIVIAL_SIN_NUBE=1` se jugaron cuatro turnos reales y funcionó todo:

- Carga la partida guardada: 59-57, turno de Oscar, pregunta 83 de Megamind.
- «roxane richi» se acepta como Roxanne Ritchi, avisa de la errata y suma punto.
- El turno pasa a Alicia con una franquicia distinta y la misma dificultad.
- Una respuesta fallada muestra la correcta; «Era correcta» sube 57 a 58.
- Descartar una pregunta mantiene jugador y número, y sirve otra que además
  respeta el veto de formato.
- Consola del navegador limpia; en el servidor solo los errores esperados de
  Supabase sin claves.

Eso cubre los formatos `corta` y `multiple`. Los otros cinco y la pantalla de
banco agotado **existen en el código pero nadie los ha visto funcionar**: las
siete ramas están en `app/respuesta.tsx` y la de banco agotado en `app/juego.tsx`.
Ver el punto 1 de «Pendiente».

El rebote y las correcciones del veredicto llegaron después de esta sesión de
navegador, así que solo están comprobados por `simular`.

### Modo sin nube

`TRIVIAL_SIN_NUBE=1` en `.env.local` hace que, si Supabase falla, la web juegue
en local desde el estado semilla en vez de enseñar la pantalla de configuración.
**No guarda nada y se reinicia al recargar.** Es solo para probar la interfaz;
en cuanto haya claves reales deja de activarse, porque la carga ya no falla.

## Despliegue

Está en producción y funcionando.

| | |
| --- | --- |
| Vercel | `oscaralvarezs-projects/trivial-animacion`, plan Hobby, Node 24.x |
| URL | https://trivial-animacion-rho.vercel.app |
| Supabase | proyecto `yanwsicuprdrgwfjynfw` |
| Repo | https://github.com/oscaralvarezrua/trivial-animacion, rama `main` |

**Las tres variables de entorno están marcadas «Sensitive» en Vercel.** Eso las
hace de solo escritura: ni el panel ni la CLI pueden leerlas, y
`vercel env pull` escribe el literal `[SENSITIVE]` en vez del valor. Para
rehacer un `.env.local` no sirve de nada tirar de Vercel: la URL sale del ref de
Supabase de la tabla de arriba, la *service role key* del panel de Supabase
(Project Settings → API Keys → `service_role`) y el PIN solo lo sabe Oscar.

Ojo con no confundirse de sitio: `trivial-animacion.vercel.app`, sin el `-rho`,
es de otra persona y no tiene nada que ver con esto.

## Montar el proyecto en una máquina nueva

Dos tropiezos que parecen fallos del código y no lo son:

1. `npm run typecheck` falla nada más clonar con «Cannot find name
   `LayoutProps`». Ese tipo global lo genera Next, así que hay que correr
   `npm run build` una vez antes. `app/layout.tsx` está bien; no hay que tocarlo.
2. npm 11 no ejecuta los postinstall de `esbuild` ni de `unrs-resolver`. Sin
   ellos `tsx` no arranca y se caen `validar`, `probar` y `simular`. Se arregla
   con `npm approve-scripts esbuild`, lo mismo para `unrs-resolver`, y luego
   `npm rebuild`. Eso deja un bloque `allowScripts` en `package.json`.

O sea: `npm install` → `npm approve-scripts` → `npm rebuild` → `npm run build` →
ya el resto.

## Pendiente

1. **Probar en el navegador los cinco formatos que faltan**: `vf`, `orden`,
   `relacionar`, `describir` y `completar`, más la pantalla de banco agotado.
   Es lo único del juego que nunca ha visto nadie funcionando. También conviene
   ejercitar a mano el rebote y las dos correcciones del veredicto, que hasta
   ahora solo los ha comprobado `simular`.
2. **Ampliar el banco.** Con 220 preguntas, el último 15 % de la partida se
   juega con los filtros de variedad relajados: se repiten formatos y alguna
   ronda sale con dificultades desiguales. Se arregla añadiendo líneas a
   `lib/banco/`, y sobre todo de dificultad **media**: es la única cuyo peso en
   el banco (27 %) queda por debajo de lo que pide el sorteo (30 %). Fácil va
   sobrada (62 % frente a 60 %) y difícil cuadra (11 % frente a 10 %), y encima
   el sorteo veta las difíciles después de una pregunta de opciones, así que
   gasta menos de lo que su peso sugiere.
3. **Nada urgente más.** Supabase, el despliegue, el README y el PIN ya están
   hechos, y el árbol está limpio salvo el `allowScripts` de `package.json`.

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
  del despliegue, así que esconder la pantalla no bastaría. De ahí el PIN: se
  comprueba en `app/page.tsx` para no enseñar la partida y otra vez dentro de
  cada Server Action, en `lib/acceso.ts`, que es donde está el dato. En la
  cookie viaja un hash con sal, no el PIN. Cambiar `TRIVIAL_PIN` invalida de
  golpe todas las sesiones abiertas.
- Si `TRIVIAL_PIN` se deja vacío la web queda abierta, y es a propósito:
  quedarse fuera de vuestra propia partida por una variable mal puesta es peor
  que el riesgo que cubre.
- El estado de la partida cabe entero en una fila jsonb con id `oscar-alicia`.
- Los ~130 datos del registro de preguntas ya usadas del prompt original están
  excluidos del banco: ninguna pregunta los repite.
