const test = require('node:test');
const assert = require('node:assert/strict');

test('Release uploads then deploys the same revision without modifying domain triggers', async () => {
  const { deployProduction } = await import('../scripts/deploy-production.mjs');
  const calls=[];
  deployProduction('ae74105712a2', (command,args) => calls.push(args));
  assert.equal(calls.length,2);
  assert.deepEqual(calls[0].slice(1,3),['versions','upload']);
  assert.deepEqual(calls[1].slice(1,3),['versions','deploy']);
  assert.equal(calls[0][calls[0].indexOf('--tag')+1],'educade-ae74105712a2');
  assert.equal(calls[1][calls[1].indexOf('--version-tag')+1],'educade-ae74105712a2@100');
  for (const args of calls) {
    assert.equal(args[args.indexOf('--config')+1],'wrangler.production.jsonc');
    assert.ok(!args.includes('triggers'));
  }
});

test('Failed upload never deploys an older or unrelated version', async () => {
  const { deployProduction } = await import('../scripts/deploy-production.mjs');
  let calls=0;
  assert.throws(() => deployProduction('ae74105712a2', () => {
    calls++;throw new Error('Upload rejected');
  }), /Upload rejected/);
  assert.equal(calls,1);
});

test('A release requires a valid committed revision before any remote operation', async () => {
  const { deployProduction } = await import('../scripts/deploy-production.mjs');
  let calls=0;
  assert.throws(() => deployProduction('invalid', () => calls++), /committed release revision/);
  assert.equal(calls,0);
});
