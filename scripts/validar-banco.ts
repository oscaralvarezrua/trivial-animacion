import { PREGUNTAS, franquicias, validarBanco } from "../lib/preguntas";
import type { Difficulty, QuestionFormat } from "../lib/types";

const errores = validarBanco();

const porDificultad: Record<Difficulty, number> = { facil: 0, media: 0, dificil: 0 };
const porFormato: Record<string, number> = {};

for (const q of PREGUNTAS) {
  porDificultad[q.difficulty]++;
  porFormato[q.format] = (porFormato[q.format] ?? 0) + 1;
}

const total = PREGUNTAS.length;
const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

console.log(`Preguntas: ${total}`);
console.log(`Franquicias: ${franquicias().length}`);
console.log(
  `Dificultad -> fácil ${porDificultad.facil} (${pct(porDificultad.facil)}), ` +
    `media ${porDificultad.media} (${pct(porDificultad.media)}), ` +
    `difícil ${porDificultad.dificil} (${pct(porDificultad.dificil)})`,
);
console.log("Formatos:");
for (const [formato, n] of Object.entries(porFormato).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${(formato as QuestionFormat).padEnd(12)} ${n}`);
}

if (errores.length > 0) {
  console.log(`\n${errores.length} problemas:`);
  for (const e of errores) console.log(`  - ${e}`);
  process.exit(1);
}

console.log("\nBanco válido.");
