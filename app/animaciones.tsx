"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Animaciones de la partida.
 *
 * Todas pasan por `useReducedMotion`, que lee la preferencia del sistema: si
 * está puesta, se quedan en cero y la pantalla cambia de golpe. No es un
 * detalle opcional, porque el juego encadena cambios de panel muy seguidos y
 * para quien tiene sensibilidad al movimiento eso marea.
 *
 * La regla que se ha seguido: la animación explica el cambio, no lo adorna. El
 * panel se desliza en la dirección en la que avanza la partida, y el marcador
 * pega un salto solo cuando el número cambia de verdad.
 */

/** Curva estándar: sale rápido y frena al final, que es lo que se siente natural. */
const CURVA = [0.2, 0, 0, 1] as const;

/**
 * Envoltorio de los paneles que se turnan en el centro: pregunta, rebote,
 * veredicto y resumen. Al cambiar `id`, React desmonta el anterior y monta este
 * de cero, así que reproduce su entrada.
 *
 * **Solo anima la entrada, no la salida.** Se probó con `AnimatePresence` en
 * modo `wait` y no llegó a funcionar: el panel viejo se quedaba montado y la
 * salida no se disparaba nunca, ni en desarrollo ni en producción. Pero además,
 * aunque hubiera funcionado, encadenar salida y entrada mete casi un cuarto de
 * segundo muerto en cada pregunta, y aquí se responden cientos seguidas. Que el
 * panel anterior desaparezca en seco y el nuevo entre es más rápido de jugar.
 */
export function Panel({ id, children }: { id: string; children: ReactNode }) {
  const quieto = useReducedMotion();

  return (
    <motion.div
      key={id}
      initial={quieto ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: quieto ? 0 : 0.24, ease: CURVA }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Número del marcador. Solo se anima cuando cambia el valor: al remontarse por
 * el `key` reproduce el rebote de entrada, así que un turno que no suma no
 * mueve nada.
 *
 * Se usa muelle en vez de duración fija porque un punto ganado tiene que
 * sentirse, y un muelle da ese golpecito seco que una curva suave no da.
 *
 * Crece hacia su tamaño en vez de encoger desde uno mayor. Empezando por
 * encima del 100 % el número se sale de la tarjeta mientras dura la animación,
 * y con marcadores de tres cifras eso llega a asomar por el borde de la
 * pantalla. Así nunca es más grande que en reposo.
 */
export function Puntuacion({ valor, color }: { valor: number; color?: string }) {
  const quieto = useReducedMotion();

  return (
    <motion.p
      key={valor}
      initial={quieto ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="text-4xl leading-none font-semibold tabular-nums sm:text-5xl"
      style={{ color, transformOrigin: "left bottom" }}
    >
      {valor}
    </motion.p>
  );
}

/**
 * Etiquetas de la cabecera de la pregunta, entrando escalonadas. El retraso es
 * mínimo: lo justo para que la vista aterrice en el enunciado y no en los
 * adornos.
 */
export function Etiquetas({ children }: { children: ReactNode }) {
  const quieto = useReducedMotion();

  return (
    <motion.header
      className="flex flex-wrap items-center gap-2"
      initial="oculto"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: quieto ? 0 : 0.05 } },
      }}
    >
      {children}
    </motion.header>
  );
}

export function Etiqueta({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const quieto = useReducedMotion();

  return (
    <motion.span
      className={className}
      style={style}
      variants={{
        oculto: { opacity: 0, y: quieto ? 0 : 4 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: quieto ? 0 : 0.2, ease: CURVA }}
    >
      {children}
    </motion.span>
  );
}
