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
