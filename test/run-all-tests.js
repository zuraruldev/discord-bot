import { build } from 'esbuild';
import { readdir, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const testFiles = (await readdir('test')).filter(f => f.endsWith('.test.ts'));
let failed = false;

for (const file of testFiles) {
    const outfile = path.join('test', `.tmp-${file.replace('.ts', '.mjs')}`);
    try {
        await build({
            entryPoints: [path.join('test', file)],
            outfile,
            bundle: true,
            packages: 'external',
            format: 'esm',
            target: 'esnext',
            platform: 'node',
            logLevel: 'error'
        });
        const res = spawnSync('node', ['--test', outfile], { stdio: 'inherit' });
        if (res.status !== 0) {
            failed = true;
        }
    } finally {
        try {
            await unlink(outfile);
        } catch {
            // ignore
        }
    }
}

if (failed) {
    process.exit(1);
}
