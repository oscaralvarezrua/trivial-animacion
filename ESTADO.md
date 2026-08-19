# Estado del proyecto — Trivial de animación

Documento de contexto para retomar el trabajo sin depender del historial de chat.
Última actualización: 18 de agosto de 2026.

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
| Tamaño del banco | 440 preguntas, tras doblar las 220 iniciales | Con 220 el último tramo de partida perdía variedad |
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

### Estadísticas de fin de partida

Al agotarse el banco y al pulsar «Reiniciar partida» se enseña un resumen por
jugador: aciertos sobre intentos en total, por formato y por categoría.

- Se calcula entero desde `history`, así que no hay contadores en el estado ni
  hubo que migrar la partida guardada.
- **El rebote cuenta como un intento más de quien lo jugó.** Si el titular falla
  y el rival acierta, eso es un fallo para uno y un acierto para el otro dentro
  de la misma pregunta. Pasar no cuenta como intento: no llegó a responder, y
  apuntárselo como fallo diría que se equivocó cuando lo que hizo fue no
  arriesgarse. Los pases se cuentan aparte, en una línea suelta.
- Solo se pintan las filas con algún intento. Con 7 formatos y 10 categorías,
  una tabla de ceros taparía lo poco que se hubiera jugado.
- El reinicio ya no pregunta «¿seguro?» a secas: enseña el resumen primero,
  porque es justo lo que se va a perder.

La categoría **no es un campo de cada pregunta**, sino un mapa de franquicia a
categoría en `lib/categorias.ts`. Con 164 franquicias y 440 preguntas, repetir
el dato 440 veces era pedir que se desincronizara. `validarBanco()` comprueba
que toda franquicia tenga categoría, así que añadir una nueva sin clasificarla
rompe `npm run validar`.

Manda la franquicia, no el fichero: Ratatouille cuenta como Pixar aunque su
pregunta viva en `banco/disney.ts`.

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
lib/categorias.ts        Mapa de franquicia a categoría (Disney, Pixar, DreamWorks…)
lib/estadisticas.ts      Aciertos y fallos por jugador, formato y categoría
app/acciones.ts          Server Actions: cargarPartida, guardarPartida, entrar
app/page.tsx             Server Component: PIN, luego el estado o la pantalla de configuración
app/acceso.tsx           Pantalla del PIN
app/juego.tsx            Cliente: marcador, pregunta, veredicto, rebote, banco agotado, pie
app/respuesta.tsx        Entrada de respuesta según el formato (los siete)
app/estadisticas.tsx     Resumen de la partida por jugador
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

Antes de nada, una regla que corta por lo sano: **los dígitos tienen que
coincidir exactamente**. Si no, «5» valía por «7» y «102 dálmatas» por «101
dálmatas», porque el esqueleto consonántico borra todo lo que no sea letra y
dejaba las dos respuestas en la cadena vacía. Cambiar un dígito no deja la misma
respuesta mal escrita, deja otra respuesta.

Con los números fuera, quedan dos vías para dar por buena una respuesta que no
es idéntica:

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
npm run probar      # 35 casos del corrector, incluidos los 6 del enunciado
npm run simular     # juega una partida entera y comprueba las reglas
npm run supabase    # claves y tabla, sin imprimir nunca su valor
```

Estado actual de cada uno, comprobado el 17 de agosto de 2026:

- `typecheck` y `lint`: limpios.
- `validar`: 440 preguntas, 164 franquicias, reparto 56 % / 34 % / 10 %.
- `probar`: los 35 casos pasan.
- `simular`: pasa. Comprueba a mano el veto del rebote en las preguntas de
  verdadero o falso y los cinco casos de corrección del veredicto, y luego juega
  una partida entera.

Al doblar el banco, el `simular` pasa a salir casi perfecto. La partida simulada
es aleatoria, así que varía algo entre tiradas, pero en tres seguidas: cero
franquicias repetidas antes de tiempo, cero rondas que repitan franquicia, entre
cero y una ronda con dificultad desigual (el tope tolerado son 28), y un reparto
de dificultad de 60-62 % / 31-34 % / 6-7 %.

Con 220 preguntas no salía así: 11 de las 187 rondas comprobadas quedaban
descompensadas. No era un fallo del motor. Cuando al banco se le acaban las
preguntas de la dificultad sorteada, `elegirPregunta` cede en la dificultad
antes que en el formato, y Alicia acababa con una distinta a la de Oscar. Con
440 ya no hace falta ceder.

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

En una segunda sesión, al montar las estadísticas, se jugaron cuatro turnos más
con `TRIVIAL_SIN_NUBE=1` y se comprobó:

- El formato `relacionar`, que nunca se había visto: los cuatro desplegables
  funcionan y corrige bien.
- El **rebote entero**: Oscar falla una de opciones, salta el rebote a Alicia
  sin revelar la solución, acierta y se le suma el punto.
- El resumen al pulsar «Reiniciar partida»: Oscar 1 de 2 (50 %) y Alicia 3 de 3
  (100 %), con el desglose por formato y por categoría cuadrando, y el rebote
  contando como acierto de Alicia en `multiple` y en «Series de dibujos».
- «Cancelar» devuelve a la partida con el estado intacto.

Quedan por ejercitar `vf`, `orden`, `describir` y `completar`, y la pantalla de
banco agotado, que no es fácil de provocar sin jugar las 440. El resumen que
sale al agotarse el banco es el mismo componente que el del reinicio, con otro
texto, así que está probado por dentro pero no en esa ruta.

Las correcciones del veredicto siguen comprobadas solo por `simular`.

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

1. **Probar en el navegador los cuatro formatos que faltan**: `vf`, `orden`,
   `describir` y `completar`, más la pantalla de banco agotado y las dos
   correcciones del veredicto. `corta`, `multiple` y `relacionar` ya están
   vistos, y el rebote también.
2. **Repasar las preguntas nuevas.** El banco pasó de 220 a 440 de una tacada, y
   las 220 nuevas las redactó Claude de memoria, no salieron de ninguna fuente
   consultada. La estructura la valida `npm run validar`, pero **que el dato sea
   cierto no lo comprueba nadie**. Conviene leerlas con calma antes de fiarse,
   sobre todo años, nombres de doblaje y personajes secundarios.
3. **Vigilar el reparto de dificultad.** Ahora es 56 % / 34 % / 10 % y el sorteo
   pide 60 / 30 / 10, así que la escasa ha pasado a ser la **fácil**. Todavía
   sobra margen, pero si algún día se amplía otra vez, que sea de fáciles.
4. **Nada urgente más.** Supabase, el despliegue, el README y el PIN ya están
   hechos.

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
