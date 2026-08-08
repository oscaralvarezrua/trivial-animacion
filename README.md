# Trivial de animación

Web para que Oscar y Alicia jueguen a un trivial de películas y series de
animación en un mismo dispositivo, por turnos. Las reglas están implementadas
como código: **no hay ninguna llamada a IA en tiempo de ejecución**, y las 220
preguntas viven en un banco local en TypeScript.

El contexto largo del proyecto —decisiones, reglas y su porqué— está en
[ESTADO.md](ESTADO.md).

## Arrancar en local

```bash
npm install
```

Copia `.env.local.example` a `.env.local` y rellena los dos valores de Supabase:

| Variable | Dónde sale |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → `service_role` |
| `TRIVIAL_PIN` | Lo eliges tú: el PIN compartido para entrar |

La URL va sin ruta ni barra final: `https://xxxxxxxxxxxx.supabase.co`.

La primera vez, ejecuta el contenido de [`supabase/esquema.sql`](supabase/esquema.sql)
en el SQL Editor de Supabase para crear la tabla `partidas`. Después:

```bash
npm run supabase
```

Comprueba que las claves valen y que la tabla existe, sin imprimirlas nunca. Y ya:

```bash
npm run dev
```

En [localhost:3000](http://localhost:3000). Si Supabase no está configurado, la
web enseña una pantalla explicando qué falta en vez de romperse.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run validar` | Estructura y reparto del banco de preguntas |
| `npm run probar` | 25 casos del corrector de respuestas |
| `npm run simular` | Juega una partida entera y comprueba las reglas |
| `npm run supabase` | Comprueba la conexión con la base de datos |

## Cómo está montado

- **Next.js 16** (App Router, Server Actions), React 19, TypeScript, Tailwind 4.
- **Supabase (Postgres)** guarda la partida entera en una fila `jsonb`, para
  poder retomarla desde cualquier sitio.
- El acceso a la base de datos va **solo por Server Actions** con la service role
  key. La tabla tiene RLS activado y ninguna política, así que la clave pública
  no sirve para nada y nunca llega al navegador.

```
lib/motor.ts        Elección de pregunta, turnos, puntuación
lib/corrector.ts    Acepta erratas sin colar respuestas distintas
lib/banco/          Las 220 preguntas, por familias
app/page.tsx        Lee el estado o enseña la pantalla de configuración
app/juego.tsx       Marcador, pregunta, veredicto
```

## Desplegar

Importa el repositorio en [Vercel](https://vercel.com/new) y define las dos
variables de entorno de arriba en Project Settings → Environment Variables. El
plan Hobby sobra.

## El PIN

Las Server Actions son invocables por POST por cualquiera que conozca la URL del
despliegue, así que esconder la pantalla no bastaría. `TRIVIAL_PIN` cierra las
dos puertas:

- [`app/page.tsx`](app/page.tsx) no enseña la partida sin sesión.
- [`lib/acceso.ts`](lib/acceso.ts) comprueba la sesión **dentro de cada Server
  Action**, antes de tocar Supabase, que es donde está el dato.

En la cookie no viaja el PIN sino un hash con sal, la comparación es en tiempo
constante y la sesión dura un año. Cambiar `TRIVIAL_PIN` invalida de golpe todas
las sesiones abiertas, que es la forma de echar a alguien.

Si `TRIVIAL_PIN` se deja vacío no hay PIN y la web queda abierta. Es a propósito:
quedarse fuera de tu propia partida por una variable mal puesta es peor que el
riesgo que cubre.
