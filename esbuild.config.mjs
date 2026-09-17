import esbuild from 'esbuild';
import {readFileSync} from 'node:fs';
const notices = readFileSync(new URL('./THIRD-PARTY-NOTICES.txt', import.meta.url), 'utf8');
const options = {
  entryPoints: ['main.ts'], bundle: true, outfile: 'main.js', format: 'cjs',
  target: 'es2020', platform: 'browser', sourcemap: false,
  external: ['obsidian', 'electron', '@codemirror/state', '@codemirror/view'],
  banner: {js: '/* Unified Typography — generated bundle. Source: main.ts and src/ */\n/*!\n' + notices + '\n*/'}
};
if (process.argv.includes('--watch')) {
  const context = await esbuild.context(options);
  await context.watch();
} else await esbuild.build(options);
