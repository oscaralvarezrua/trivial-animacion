/**
 * Categorías del banco.
 *
 * La categoría NO es un campo de cada pregunta, sino un mapa de franquicia a
 * categoría que vive aquí. Son 164 franquicias y 440 preguntas: tocar 440
 * objetos para repetir un dato que ya se deduce de la franquicia sería pedir
 * que se desincronicen. Con el mapa hay un único sitio donde mirar y donde
 * corregir.
 *
 * `validarBanco()` comprueba que toda franquicia del banco esté aquí, así que
 * añadir una franquicia nueva sin categoría rompe `npm run validar`.
 */

export const CATEGORIAS = [
  "Disney",
  "Pixar",
  "DreamWorks",
  "Illumination",
  "Ghibli",
  "Anime",
  "Series de dibujos",
  "Infantil",
  "Animación española",
  "Superhéroes",
  "Otros estudios",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

/**
 * Se agrupa por estudio o por origen, que es como lo tiene clasificado
 * cualquiera que vea dibujos. Ratatouille es Pixar aunque su pregunta viva en
 * `banco/disney.ts`: manda la franquicia, no en qué fichero se escribió.
 */
const POR_FRANQUICIA: Record<string, Categoria> = {
  // --- Disney ---
  "101 dálmatas": "Disney",
  Aladdín: "Disney",
  "Alicia en el País de las Maravillas": "Disney",
  Atlantis: "Disney",
  Bambi: "Disney",
  "Big Hero 6": "Disney",
  Blancanieves: "Disney",
  Bolt: "Disney",
  Cenicienta: "Disney",
  "Clásicos Disney": "Disney",
  "Compañeros Disney": "Disney",
  "Disney años 90 y 2000": "Disney",
  "Disney reciente": "Disney",
  Dumbo: "Disney",
  "El Rey León": "Disney",
  "El emperador y sus locuras": "Disney",
  "El jorobado de Notre Dame": "Disney",
  "El libro de la selva": "Disney",
  "El planeta del tesoro": "Disney",
  Encanto: "Disney",
  Enredados: "Disney",
  Frozen: "Disney",
  "Hermano Oso": "Disney",
  Hércules: "Disney",
  "La Bella Durmiente": "Disney",
  "La Bella y la Bestia": "Disney",
  "La Sirenita": "Disney",
  "Lilo & Stitch": "Disney",
  "Los Aristogatos": "Disney",
  "Los Rescatadores": "Disney",
  "Mascotas Disney": "Disney",
  "Mickey Mouse": "Disney",
  Mulán: "Disney",
  "Pato Donald": "Disney",
  "Peter Pan": "Disney",
  Pinocho: "Disney",
  Pocahontas: "Disney",
  "Princesas Disney": "Disney",
  "Raya y el último dragón": "Disney",
  "Robin Hood": "Disney",
  "Rompe Ralph": "Disney",
  Tarzán: "Disney",
  "Tiana y el sapo": "Disney",
  "Tod y Toby": "Disney",
  Vaiana: "Disney",
  "Villanos Disney": "Disney",
  "Winnie the Pooh": "Disney",
  Wish: "Disney",
  Zootrópolis: "Disney",

  Fantasía: "Disney",
  "La dama y el vagabundo": "Disney",
  "Merlín el encantador": "Disney",
  "Basil el ratón superdetective": "Disney",
  "Oliver y su pandilla": "Disney",
  "El caldero mágico": "Disney",
  "Chicken Little": "Disney",

  // --- Pixar ---
  Bichos: "Pixar",
  Brave: "Pixar",
  "Buscando a Dory": "Pixar",
  "Buscando a Nemo": "Pixar",
  Cars: "Pixar",
  Coco: "Pixar",
  "Del revés": "Pixar",
  "El viaje de Arlo": "Pixar",
  Elemental: "Pixar",
  "Los Increíbles": "Pixar",
  Luca: "Pixar",
  "Monstruos S.A.": "Pixar",
  "Monstruos University": "Pixar",
  Onward: "Pixar",
  "Pixar clásico": "Pixar",
  "Pixar reciente": "Pixar",
  Ratatouille: "Pixar",
  Red: "Pixar",
  Soul: "Pixar",
  "Toy Story": "Pixar",
  Up: "Pixar",
  "Villanos Pixar": "Pixar",
  "WALL·E": "Pixar",

  // --- DreamWorks ---
  "Bee Movie": "DreamWorks",
  "Cómo entrenar a tu dragón": "DreamWorks",
  DreamWorks: "DreamWorks",
  "El gato con botas": "DreamWorks",
  "El origen de los guardianes": "DreamWorks",
  "El príncipe de Egipto": "DreamWorks",
  "Kung Fu Panda": "DreamWorks",
  "Los Croods": "DreamWorks",
  Madagascar: "DreamWorks",
  Megamind: "DreamWorks",
  Shrek: "DreamWorks",
  Trolls: "DreamWorks",

  // --- Illumination ---
  Canta: "Illumination",
  "El Grinch": "Illumination",
  "El Lorax": "Illumination",
  "Los Minions": "Illumination",
  Mascotas: "Illumination",
  "Mi villano favorito": "Illumination",

  // --- Ghibli ---
  "El castillo ambulante": "Ghibli",
  "El viaje de Chihiro": "Ghibli",
  "La princesa Mononoke": "Ghibli",
  "Mi vecino Totoro": "Ghibli",
  "Nicky, la aprendiz de bruja": "Ghibli",
  Ponyo: "Ghibli",
  "Studio Ghibli": "Ghibli",

  // --- Anime ---
  // Heidi, Marco y La abeja Maya son anime japonés, aunque aquí se vieran como
  // dibujos de sobremesa; Oliver y Benji, igual.
  "Anime clásico": "Anime",
  "Detective Conan": "Anime",
  Doraemon: "Anime",
  "Dragon Ball": "Anime",
  Heidi: "Anime",
  "La abeja Maya": "Anime",
  Marco: "Anime",
  Naruto: "Anime",
  "Oliver y Benji": "Anime",
  "One Piece": "Anime",
  Pokémon: "Anime",
  "Sailor Moon": "Anime",
  "Shin Chan": "Anime",

  // --- Series de dibujos ---
  "Agallas, el perro cobarde": "Series de dibujos",
  "Avatar: la leyenda de Aang": "Series de dibujos",
  "Ben 10": "Series de dibujos",
  "Bob Esponja": "Series de dibujos",
  "El asombroso mundo de Gumball": "Series de dibujos",
  Futurama: "Series de dibujos",
  "Gravity Falls": "Series de dibujos",
  "Hora de aventuras": "Series de dibujos",
  "Inspector Gadget": "Series de dibujos",
  "Kim Possible": "Series de dibujos",
  "Las Supernenas": "Series de dibujos",
  "Las Tortugas Ninja": "Series de dibujos",
  "Looney Tunes": "Series de dibujos",
  "Los Padrinos Mágicos": "Series de dibujos",
  "Los Picapiedra": "Series de dibujos",
  "Los Pitufos": "Series de dibujos",
  "Los Rugrats": "Series de dibujos",
  "Los Simpson": "Series de dibujos",
  "Mascotas de series": "Series de dibujos",
  "Phineas y Ferb": "Series de dibujos",
  "Scooby-Doo": "Series de dibujos",
  "Series de dibujos": "Series de dibujos",
  "Somos osos": "Series de dibujos",
  "Steven Universe": "Series de dibujos",

  "Tom y Jerry": "Series de dibujos",
  "La Pantera Rosa": "Series de dibujos",
  Popeye: "Series de dibujos",
  "El laboratorio de Dexter": "Series de dibujos",
  "Johnny Bravo": "Series de dibujos",
  "Vaca y Pollo": "Series de dibujos",
  "Ed, Edd y Eddy": "Series de dibujos",
  "Las macabras aventuras de Billy y Mandy": "Series de dibujos",
  Foster: "Series de dibujos",
  "Oye Arnold": "Series de dibujos",
  "Los Castores Cascarrabias": "Series de dibujos",
  "Invasor Zim": "Series de dibujos",
  "Jimmy Neutrón": "Series de dibujos",
  "Danny Phantom": "Series de dibujos",
  "Los Thornberrys": "Series de dibujos",
  "La vida moderna de Rocko": "Series de dibujos",
  "Padre de familia": "Series de dibujos",
  "South Park": "Series de dibujos",
  "Rick y Morty": "Series de dibujos",
  Arcane: "Series de dibujos",
  "Super Mario": "Otros estudios",

  // --- Infantil ---
  Bluey: "Infantil",
  "La Patrulla Canina": "Infantil",
  "Masha y el Oso": "Infantil",
  "Peppa Pig": "Infantil",
  Pocoyó: "Infantil",
  "Series preescolares": "Infantil",

  // --- Animación española ---
  "D'Artacan": "Animación española",
  "David el Gnomo": "Animación española",
  Klaus: "Animación española",
  "Las Tres Mellizas": "Animación española",
  "Los Fruittis": "Animación española",
  "Los Trotamúsicos": "Animación española",
  "Mortadelo y Filemón": "Animación española",
  "Series españolas": "Animación española",
  "Willy Fog": "Animación española",

  // --- Superhéroes ---
  // Manda el personaje, no el estudio: Spider-Man es de Sony y aquí está.
  Marvel: "Superhéroes",
  DC: "Superhéroes",
  "Spider-Man": "Superhéroes",

  // --- Otros estudios ---
  // Sony, Blue Sky, Aardman, Laika, Warner y las mezclas de varios estudios.
  Anastasia: "Otros estudios",
  "Chicken Run": "Otros estudios",
  Coraline: "Otros estudios",
  "El Gigante de Hierro": "Otros estudios",
  "El Principito": "Otros estudios",
  "Estudios de animación": "Otros estudios",
  "Hotel Transilvania": "Otros estudios",
  "Ice Age": "Otros estudios",
  "Lluvia de albóndigas": "Otros estudios",
  "Lugares de ficción": "Otros estudios",
  "Pesadilla antes de Navidad": "Otros estudios",
  "Robots de la animación": "Otros estudios",
  Río: "Otros estudios",
  "Wallace y Gromit": "Otros estudios",
};

/** La categoría de una franquicia, o null si no está mapeada. */
export function categoriaDe(franquicia: string): Categoria | null {
  return POR_FRANQUICIA[franquicia] ?? null;
}
