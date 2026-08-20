import type { Question } from "./types";

/**
 * Emojis que estropean la pregunta.
 *
 * Cada pregunta lleva un emoji que se pinta junto a la franquicia. Es
 * decorativo, pero puede arruinar la pregunta de dos maneras:
 *
 * 1. **Regalando la respuesta.** 🦥 en «¿qué animal es Sid?» da el punto.
 * 2. **Empujando a una equivocada.** 🦣 en esa misma pregunta no regala nada,
 *    pero invita a contestar «mamut», que es justo lo que no es. Eso es peor
 *    que chivarse: es jugar sucio.
 *
 * Por eso la regla no mira solo la palabra del emoji, sino su familia: si la
 * respuesta es un animal, el emoji no puede ser **ningún** animal. Si es un
 * color, ningún color. Da igual que acierte o que despiste.
 *
 * La excepción es que el enunciado ya lo diga («¿qué animal es Sid, el
 * perezoso?»): entonces el emoji no añade ni quita nada.
 *
 * Solo se vigilan las familias que pueden ser respuesta de verdad. Un 🎬 o un
 * 📺 no delatan nada y no hace falta listarlos.
 */

type Familia = "animal" | "color" | "comida" | "objeto" | "elemento";

const VOCABULARIO: Record<Familia, Record<string, string[]>> = {
  animal: {
    "🐱": ["gato", "gata", "gatit"], "🐈": ["gato", "gata", "gatit"], "🐈‍⬛": ["gato", "gata"],
    "🐶": ["perro", "perra", "perrit"], "🐕": ["perro", "perra", "perrit"],
    "🐩": ["perro", "caniche"], "🐺": ["lobo", "loba"], "🦊": ["zorro", "zorra"],
    "🐭": ["raton"], "🐁": ["raton"], "🐀": ["rata"],
    "🐰": ["conejo", "coneja", "conejit"], "🐇": ["conejo", "coneja", "conejit"],
    "🐻": ["oso", "osa", "osit"], "🐻‍❄️": ["oso polar", "oso"], "🐼": ["panda"],
    "🦁": ["leon", "leona"], "🐯": ["tigre", "tigresa"], "🐆": ["pantera", "leopardo", "guepardo"],
    "🐴": ["caballo", "yegua", "potro", "mustango"], "🐎": ["caballo", "yegua", "potro", "mustango"],
    "🦓": ["cebra"], "🦌": ["ciervo", "cervat", "reno"], "🦣": ["mamut"],
    "🐮": ["vaca", "toro"], "🐄": ["vaca", "toro"], "🐂": ["toro", "buey"],
    "🐷": ["cerdo", "cerdit", "cochino"], "🐗": ["jabali"],
    "🐘": ["elefante", "elefanta"], "🦥": ["perezoso"], "🦦": ["nutria"],
    "🦘": ["canguro", "ualabi"], "🦫": ["castor"], "🐨": ["koala"],
    "🐒": ["mono", "mona", "chimpance"], "🐵": ["mono", "mona", "chimpance"], "🦍": ["gorila"],
    "🐔": ["gallina", "gallo", "pollo"], "🐓": ["gallo", "gallina"],
    "🐤": ["pollito", "canario", "pajaro"], "🐥": ["pollito", "pollo"], "🐦": ["pajaro", "ave"],
    "🦅": ["aguila", "halcon"], "🦉": ["buho", "lechuza"],
    "🦆": ["pato", "pata"], "🦢": ["cisne"], "🦤": ["dodo", "cacatua"],
    "🦜": ["loro", "guacamayo", "cacatua"], "🐧": ["pingüino", "pinguino"],
    "🦩": ["flamenco"], "🦚": ["pavo real", "pavo"], "🦃": ["pavo"], "🕊️": ["paloma"],
    "🐸": ["rana", "sapo"], "🐍": ["serpiente", "culebra"], "🐢": ["tortuga"],
    "🦎": ["lagarto", "camaleon", "lagartija"], "🐊": ["cocodrilo", "caiman"],
    "🐙": ["pulpo"], "🦑": ["calamar"], "🦀": ["cangrejo"], "🦐": ["gamba"],
    "🐌": ["caracol"], "🐝": ["abeja"], "🦗": ["saltamontes", "grillo"], "🐜": ["hormiga"],
    "🕷️": ["arana"], "🦂": ["escorpion"], "🐛": ["oruga", "gusano"], "🦋": ["mariposa"],
    "🐟": ["pez", "peces"], "🐠": ["pez", "peces"], "🐡": ["pez", "peces"],
    "🦈": ["tiburon"], "🐬": ["delfin"], "🐳": ["ballena"], "🐋": ["ballena"],
    "🦭": ["foca"], "🦛": ["hipopotam"], "🦏": ["rinoceronte"],
    "🐪": ["camello"], "🐫": ["camello"], "🦙": ["llama", "alpaca"],
    "🐑": ["oveja", "cordero", "borrego"], "🐐": ["cabra", "cabrit"],
    "🦇": ["murcielago"], "🦝": ["mapache"], "🦡": ["tejon", "comadreja"],
    "🦔": ["erizo"], "🐿️": ["ardilla"], "🦖": ["dinosaurio", "tiranosaurio"], "🦕": ["dinosaurio"],
  },
  color: {
    "🔴": ["rojo", "roja"], "🟠": ["naranja"], "🟡": ["amarillo", "amarilla"],
    "🟢": ["verde"], "🔵": ["azul"], "🟣": ["morado", "morada", "purpura"],
    "🟤": ["marron"], "⚫": ["negro", "negra"], "⚪": ["blanco", "blanca"],
    "🩷": ["rosa"], "💚": ["verde"], "💙": ["azul"], "💛": ["amarillo", "amarilla"],
    "❤️": ["rojo", "roja"], "🖤": ["negro", "negra"], "🤍": ["blanco", "blanca"],
    "💜": ["morado", "morada"], "🧡": ["naranja"],
  },
  comida: {
    "🥬": ["espinaca", "lechuga", "verdura"], "🥕": ["zanahoria"], "🍄": ["seta", "champinon"],
    "🧅": ["cebolla"], "🍯": ["miel"], "🧀": ["queso"], "🍕": ["pizza"],
    "🍔": ["hamburguesa", "cangreburger"], "🍝": ["espagueti", "pasta", "lasana"],
    "🍩": ["rosquilla", "donut"], "🍪": ["galleta"], "🌰": ["bellota"],
    "🍌": ["platano"], "🍎": ["manzana"], "🥒": ["pepinillo", "pepino"],
    "🌭": ["salchicha"], "🍜": ["ramen", "fideo"], "🥪": ["sandwich", "bocadillo"],
    "🍬": ["caramelo", "chuche", "gominola"], "🥚": ["huevo"], "🍿": ["palomitas"],
    "🍑": ["melocoton"], "🍍": ["pina"], "🍖": ["carne"],
  },
  objeto: {
    "💎": ["diamante", "gema", "kryptonita", "kriptonita"], "🔨": ["martillo"],
    "🏹": ["arco", "flecha"], "🗡️": ["espada", "katana"], "⚔️": ["espada", "katana"],
    "🛡️": ["escudo"], "🧹": ["escoba"], "🪄": ["varita"], "🔔": ["campana"],
    "👑": ["corona"], "👓": ["gafas"], "🎩": ["sombrero", "chistera"],
    "🧤": ["guante", "guantelete"], "🎸": ["guitarra"], "🎷": ["saxofon", "saxo"],
    "🎻": ["violin"], "🎺": ["trompeta"], "🥁": ["bateria", "tambor"], "🎹": ["piano"],
    "⚽": ["futbol", "balon"], "🏀": ["baloncesto", "basket"], "🏈": ["rugby"],
    "🚀": ["cohete"], "🛵": ["vespa", "moto"], "🚗": ["coche"],
    "🚢": ["barco", "crucero"], "📦": ["caja", "carton"],
    "🧱": ["ladrillo", "lego", "plastilina"], "📓": ["diario", "cuaderno"],
    "📖": ["libro"], "📚": ["libro"], "📷": ["camara", "fotografo"],
    "💻": ["ordenador", "internet"], "☎️": ["telefono"], "⌚": ["reloj"],
    "🪙": ["moneda"], "💰": ["tesoro", "dinero"], "🧺": ["cesta"],
    "🩺": ["estetoscopio"], "🔫": ["pistola", "cazador"],
    "👠": ["zapato"], "🩳": ["pantalon"], "🪝": ["anzuelo"], "🧲": ["iman", "magnetismo"],
    "🕸️": ["telarana"], "🪕": ["shamisen", "banjo"],
    "⚓": ["marinero", "marino", "ancla"], "🎃": ["calabaza", "halloween"],
    "🎄": ["navidad"], "🛼": ["patinaje", "patines"], "🥅": ["portero"],
  },
  elemento: {
    "🔥": ["fuego"], "💧": ["agua"], "🌊": ["agua", "mar"],
    "❄️": ["nieve", "hielo", "invierno"], "🧊": ["hielo"],
    "🌬️": ["aire", "viento"], "🌋": ["volcan"],
    "🏔️": ["montana", "alpes"], "🌴": ["isla", "palmera"],
    "🌲": ["arbol", "bosque"], "🌳": ["arbol", "bosque"], "🍃": ["arbol", "bosque"],
  },
};

/** Todas las palabras de una familia, vengan del emoji que vengan. */
const PALABRAS_DE_FAMILIA: Record<Familia, string[]> = {
  animal: [], color: [], comida: [], objeto: [], elemento: [],
};
const FAMILIA_DEL_EMOJI = new Map<string, Familia>();

for (const [familia, emojis] of Object.entries(VOCABULARIO) as [Familia, Record<string, string[]>][]) {
  for (const [emoji, palabras] of Object.entries(emojis)) {
    FAMILIA_DEL_EMOJI.set(emoji, familia);
    PALABRAS_DE_FAMILIA[familia].push(...palabras);
  }
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Todo lo que constituye la respuesta de una pregunta, en un solo texto. */
function textoRespuesta(q: Question): string {
  const partes = [q.official];
  if (q.format === "corta" || q.format === "describir" || q.format === "completar") {
    partes.push(...q.accepted.flat());
  }
  if (q.format === "multiple") partes.push(q.options[q.correct]);
  return normalizar(partes.join(" | "));
}

/**
 * Qué problema tiene el emoji de esta pregunta, si tiene alguno. Devuelve null
 * cuando es inocente.
 */
export function pistaDelEmoji(q: Question): string | null {
  const familia = FAMILIA_DEL_EMOJI.get(q.emoji);
  if (!familia) return null;

  const respuesta = textoRespuesta(q);
  const enunciado = normalizar(`${q.prompt} ${q.hint ?? ""}`);

  for (const palabra of PALABRAS_DE_FAMILIA[familia]) {
    const n = normalizar(palabra);
    if (respuesta.includes(n) && !enunciado.includes(n)) {
      return `la respuesta habla de «${palabra}» y el emoji es de la familia «${familia}»`;
    }
  }
  return null;
}
