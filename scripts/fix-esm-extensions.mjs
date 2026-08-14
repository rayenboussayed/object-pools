import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const entries = await readdir(outDirectory);
const files = entries.filter((file) => file.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(outDirectory, file);
  const source = await readFile(filePath, 'utf8');
  const updated = source.replaceAll(
    /(from\s+|import\s*)(['"])(\.[^'"]+)(['"])/g,
    (match, prefix, quote, specifier, endQuote) =>
      specifier.endsWith('.js')
        ? match
        : `${prefix}${quote}${specifier}.js${endQuote}`,
  );

  if (updated !== source) {
    await writeFile(filePath, updated);
    console.log(`fixed ${file}`);
  }
}
