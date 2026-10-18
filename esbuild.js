const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  outfile: 'dist/extension.js',
  sourcemap: true
};

if (isWatch) {
  esbuild.context(config).then((ctx) => ctx.watch());
} else {
  esbuild.build(config);
}
