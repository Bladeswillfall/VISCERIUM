import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import esbuild from 'esbuild';

const production = process.argv[2] === 'production';
const root = process.cwd();
const outDir = path.join(root, 'dist');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'main.ts')],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/state', '@codemirror/view', '@codemirror/language', '@lezer/common'],
  format: 'cjs',
  target: 'es2022',
  platform: 'browser',
  outfile: path.join(outDir, 'main.js'),
  nodePaths: [path.join(root, 'node_modules')],
  define: {
    'process.env.SOURCE_DATE_EPOCH': '"0"',
  },
  sourcemap: production ? false : 'inline',
  minify: production,
  treeShaking: true,
  logLevel: 'info',
});

const generatedCss = path.join(outDir, 'main.css');
try {
  await fs.rename(generatedCss, path.join(outDir, 'styles.css'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await fs.copyFile(path.join(root, 'manifest.json'), path.join(outDir, 'manifest.json'));
