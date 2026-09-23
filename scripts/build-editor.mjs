import { build } from 'esbuild';
import fs from 'node:fs/promises';
const result = await build({
  entryPoints: ['editor/runtime.mjs'], metafile: true, bundle: true, minify: true, format: 'iife',
  globalName: 'CodeMasterEditor', target: ['es2020'], legalComments: 'linked',
  outfile: 'webapp/ext/vendor/tiptap.js',
  banner: { js: 'sap.ui.define([], function () {' },
  footer: { js: 'return CodeMasterEditor; });' },
});

// Bundler comments alone omit many MIT licenses. Include package license texts too.
const packages = [...new Set(Object.keys(result.metafile.inputs)
  .filter(path => path.startsWith('node_modules/'))
  .map(path => path.split('/').slice(1, path.split('/')[1].startsWith('@') ? 3 : 2).join('/')))].sort();
const notices = [];
for (const name of packages) {
  const directory = `node_modules/${name}`;
  const metadata = JSON.parse(await fs.readFile(`${directory}/package.json`, 'utf8'));
  const files = (await fs.readdir(directory)).filter(file => /^(license|copying|notice)([.-]|$)/i.test(file)).sort();
  if (!files.length) throw new Error(`Missing license text for ${name}`);
  notices.push(`\n${'='.repeat(72)}\n${name}@${metadata.version} — ${metadata.license}\n`);
  for (const file of files) {
    notices.push(`\n--- ${file} ---\n${await fs.readFile(`${directory}/${file}`, 'utf8')}\n`);
  }
}
await fs.appendFile('webapp/ext/vendor/tiptap.js.LEGAL.txt',
  '\nThird-party package licenses. DOMPurify is used under the Apache-2.0 option.\n' + notices.join('').replace(/[ \t]+$/gm, '').trimEnd() + '\n');
