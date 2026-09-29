import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const node = process.execPath
const tsdown = resolve(here, 'node_modules/tsdown/dist/run.mjs')

// 1. Clean build artifacts
for (const dir of ['lib', 'tests']) {
  const p = resolve(here, dir)
  if (existsSync(p)) {
    const r = spawnSync(node, ['-e', `
      const { rmSync } = require('node:fs');
      rmSync(${JSON.stringify(p)}, { recursive: true, force: true });
    `], { stdio: 'inherit' })
    if (r.status !== 0) process.exit(1)
  }
}

// 2. Run tsdown build (both host + client configs in tsdown.config.ts).
// The tsdown CLI's "build" subcommand is the default action; passing "build"
// as a positional argument makes tsdown treat it as an entry file, so omit it.
console.log('--- tsdown build ---')
const tsdownResult = spawnSync(node, [tsdown], {
  cwd: here,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
})
console.log(`tsdown exit: ${tsdownResult.status}`)
if (tsdownResult.status !== 0) {
  console.error('FAIL: tsdown build failed')
  process.exit(1)
}

// 3. tsc type check
console.log('--- tsc --noEmit ---')
const tscResult = spawnSync(
  node,
  [resolve(here, 'node_modules/typescript/bin/tsc'), '--noEmit'],
  { cwd: here, stdio: 'inherit' }
)
console.log(`tsc exit: ${tscResult.status}`)
if (tscResult.status !== 0) {
  console.error('FAIL: tsc type check failed')
  process.exit(1)
}

// 4. Verify lib/ artifacts exist
console.log('--- verifying lib/ artifacts ---')
const libFiles = ['index.js', 'index.d.ts', 'client.js']
for (const f of libFiles) {
  const p = resolve(here, 'lib', f)
  if (!existsSync(p)) {
    console.error(`FAIL: missing lib/${f}`)
    console.error('lib/ contents:', existsSync(resolve(here, 'lib')) ? readdirSync(resolve(here, 'lib')) : '(dir missing)')
    process.exit(1)
  }
  console.log(`  ✓ lib/${f}`)
}

// 5. Run client-verify-0.1.7.mjs regression
console.log('--- client-verify-0.1.7.mjs ---')
const reg = spawnSync(node, [resolve(here, 'client-verify-0.1.7.mjs')], {
  cwd: here, stdio: 'inherit'
})
if (reg.status !== 0) {
  console.error('FAIL: 0.1.7 regression failed')
  process.exit(1)
}
console.log('  ✓ 0.1.7 regression')

// 6. Run contract-test.mjs
console.log('--- contract-test.mjs ---')
const contract = spawnSync(node, [resolve(here, 'contract-test.mjs')], {
  cwd: here, stdio: 'inherit'
})
if (contract.status !== 0) {
  console.error('FAIL: contract test failed')
  process.exit(1)
}
console.log('  ✓ contract test')

console.log('\n=== ALL BUILD + VERIFY STEPS PASSED ===')
console.log('lib/index.js (ESM host bundle) ✓')
console.log('lib/index.d.ts (types) ✓')
console.log('lib/client.js (CJS client bundle) ✓')
console.log('tsc --noEmit ✓')
console.log('client-verify-0.1.7.mjs ✓')
console.log('contract-test.mjs ✓')
