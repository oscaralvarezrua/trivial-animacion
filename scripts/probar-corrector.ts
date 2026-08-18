import { corregirTexto, normalizar } from "../lib/corrector";

type Caso = [respuesta: string, huecos: string[][], esperado: boolean];

const casos: Caso[] = [
  // Erratas del enunciado original: deben conceder el punto.
  ["Bemax", [["Baymax"]], true],
  ["Mani", [["Manny"]], true],
  ["Asoka", [["Ahsoka"]], true],
  ["Kronc", [["Kronk"]], true],
  ["Skiper", [["Skipper"]], true],
  ["Judy Hoops", [["Judy Hopps"]], true],
  // Tildes, mayúsculas y puntuación son irrelevantes.
  ["mulan", [["Mulán"]], true],
  ["  ¡RATATOUILLE!  ", [["Ratatouille"]], true],
  ["Muñeco", [["muñeco"]], true],
  // Artículos delante: regla 10, «el Gato» vale como «gato».
  ["el Gato", [["gato"]], true],
  // Respuesta dentro de una frase.
  ["creo que se llama Roxanne", [["Roxanne"]], true],
  // Varias respuestas obligatorias: no hay medios puntos.
  ["Miguel", [["Miguel"], ["Tulio"]], false],
  ["Miguel y Tulio", [["Miguel"], ["Tulio"]], true],
  // Variantes admitidas del mismo hueco.
  ["Eugene", [["Flynn Rider", "Eugene"]], true],
  // Resbalones de teclado en nombres largos.
  ["Rapuzel", [["Rapunzel"]], true],
  ["Ratatuille", [["Ratatouille"]], true],
  ["Bagera", [["Bagheera"]], true],
  ["Sebastian", [["Sebastián"]], true],
  // Y lo que debe seguir fallando.
  ["Nala", [["Nana"]], false],
  ["Kiara", [["Kovu"]], false],
  ["Timón", [["Pumba"]], false],
  ["Anna", [["Elsa"]], false],
  ["Simba", [["Mufasa"]], false],
  ["", [["Baymax"]], false],
  ["un personaje de Disney", [["Baymax"]], false],
  // Números: la tolerancia de erratas no puede alcanzarlos, porque cambiar un
  // dígito no deja la misma respuesta mal escrita sino otra distinta.
  // Los dos huecos son reales: dragonball-siete y cenicienta-hora.
  ["5", [["siete", "7"]], false],
  ["7", [["siete", "7"]], true],
  ["siete", [["siete", "7"]], true],
  ["10", [["medianoche", "las doce", "12"]], false],
  ["12", [["medianoche", "las doce", "12"]], true],
  // Sin la guarda del esqueleto vacío, cualquier respuesta sin consonantes
  // valdría por cualquier otra.
  ["ai", [["7"]], false],
  // Con letras alrededor tampoco: el dígito sigue siendo obligatorio.
  ["102 dálmatas", [["101 dálmatas"]], false],
  ["101 dalmatas", [["101 dálmatas"]], true],
  // Y las erratas de letra siguen valiendo aunque haya un número al lado.
  ["Big Hebo 6", [["Big Hero 6"]], true],
  ["Big Hero 5", [["Big Hero 6"]], false],
];

let fallos = 0;
for (const [respuesta, huecos, esperado] of casos) {
  const { acierto, conErrata } = corregirTexto(respuesta, huecos);
  const ok = acierto === esperado;
  if (!ok) fallos++;
  const marca = ok ? "ok  " : "FALLO";
  const nota = acierto && conErrata ? " (con errata)" : "";
  console.log(`${marca} "${respuesta}" -> ${acierto}${nota}`);
}

console.log(`\nnormalizar("Añoranza ÉPICA") = "${normalizar("Añoranza ÉPICA")}"`);
console.log(fallos === 0 ? "\nTodos los casos pasan." : `\n${fallos} casos fallan.`);
process.exit(fallos === 0 ? 0 : 1);
