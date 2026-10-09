import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const config = 'wrangler.production.jsonc';
const worker = 'nameless-unit-6af8';

export function deployProduction(revision, run = execFileSync) {
  if (!/^[a-f0-9]{12}$/.test(revision)) throw new Error('A committed release revision is required.');
  const settings = JSON.parse(readFileSync(new URL('../wrangler.production.jsonc', import.meta.url), 'utf8'));
  if (settings.name !== worker) throw new Error('Production must target the existing educade.io Worker.');
  const tag = `educade-${revision}`;
  const options = { cwd: root, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } };
  // Version upload/deploy preserves the existing routes, custom domains and
  // other non-versioned hosting settings. Never run `triggers deploy` here.
  run(process.execPath, [cli, 'versions', 'upload', '--config', config,
    '--tag', tag, '--message', `EDUCADE release ${revision}`], options);
  // The second command is reached only after a successful upload, and selects
  // that release's tag rather than an unrelated latest version.
  run(process.execPath, [cli, 'versions', 'deploy', '--config', config,
    '--version-tag', `${tag}@100`, '--yes', '--message', `EDUCADE release ${revision}`], options);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' });
    if (dirty.trim()) throw new Error('Commit tracked changes before deploying production.');
    const revision = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    deployProduction(revision);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
