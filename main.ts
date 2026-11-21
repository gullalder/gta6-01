import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR || '/output';
// Refuse incomplete local exports rather than silently delivering a broken entry.
if (!existsSync(join(root, 'game', 'index.html'))) throw new Error('Missing static game');
const images = readdirSync(join(root, 'screenshots')).filter(name => /\.(png|jpe?g)$/i.test(name));
if (images.length < 3 || images.length > 4) throw new Error('Capture three or four browser screenshots first');
mkdirSync(destination, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  cpSync(join(root, folder), join(destination, folder), { recursive: true });
}
writeFileSync(join(destination, 'dossier.json'), buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
console.log(`VICE HARBOR exported to ${destination}: ${images.length} screenshots and an offline game.`);
