import { build } from 'esbuild';
await build({
  entryPoints: ['editor/runtime.mjs'], bundle: true, minify: true, format: 'iife',
  globalName: 'CodeMasterEditor', target: ['es2020'], legalComments: 'linked',
  outfile: 'webapp/ext/vendor/tiptap.js',
  banner: { js: 'sap.ui.define([], function () {' },
  footer: { js: 'return CodeMasterEditor; });' },
});
