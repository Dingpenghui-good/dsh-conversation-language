/**
 * DSH 兼容性声明回归检查。
 *
 * 目的：确保本包声明了 `engines.dsh`，且该区间与 DSH 的安装门禁语义一致。
 *
 * 背景：DSH（`@deepseek-ai/dsh-app-boot` 的 `unmetRequirements`）在插件清单里
 * 没有 `engines.dsh` 时会退回检查 `@deepseek-ai/dsh-*` 的 `peerDependencies`，
 * 判定式为 `semver.satisfies(runtime, range, { includePrerelease: true })`。
 * 那个分支很容易踩坑——例如把 peer 钉成精确版本 `0.2.0-rc.2` 后，运行时
 * `0.2.1-rc.2` 并不满足它，安装会被直接拒绝。声明 `engines.dsh` 后，
 * 兼容范围由它**单独**决定，判定清晰且不会被 peer 的意外改动影响。
 *
 * 无外部依赖：内置一个够用的 semver 区间比较器，避免检查脚本本身需要装包。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8').replace(/^\uFEFF/, ''))

/** 解析 `X.Y.Z[-pre]`。 */
function parse(text) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(text.trim())
  if (m === null) return null
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] === undefined ? [] : m[4].split('.') }
}

/** 按 SemVer 优先级比较两个已解析版本。 */
function compare(a, b) {
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1
  }
  if (a.pre.length === 0 || b.pre.length === 0) {
    return a.pre.length === b.pre.length ? 0 : (a.pre.length === 0 ? 1 : -1)
  }
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i]
    const y = b.pre[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const nx = /^\d+$/.test(x)
    const ny = /^\d+$/.test(y)
    if (nx && ny && +x !== +y) return +x < +y ? -1 : 1
    if (nx !== ny) return nx ? -1 : 1
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}

/** 判定 version 是否满足以空格分隔的比较器集合。 */
function satisfies(version, range) {
  const target = parse(version)
  if (target === null) return false
  return range.split(/\s+/).filter(Boolean).every((part) => {
    const m = /^(>=|<=|>|<|=)?(.+)$/.exec(part)
    const bound = parse(m[2])
    if (bound === null) return false
    const delta = compare(target, bound)
    switch (m[1] ?? '=') {
      case '>=': return delta >= 0
      case '<=': return delta <= 0
      case '>': return delta > 0
      case '<': return delta < 0
      default: return delta === 0
    }
  })
}

// 1) 必须声明 engines.dsh —— 它是唯一的兼容性来源
assert.equal(
  typeof manifest.engines?.dsh,
  'string',
  'package.json must declare engines.dsh so the DSH install gate reads one authoritative range',
)

const range = manifest.engines.dsh

// 2) 必须排除未验证的版本线
assert.ok(
  range.includes('<0.3.0-0'),
  'engines.dsh must exclude 0.3.x, whose contract this package has not been verified against',
)

// 3) 必须放行实际验证过的运行时
for (const runtime of ['0.2.0-rc.2', '0.2.1-rc.2']) {
  assert.ok(
    satisfies(runtime, range),
    `engines.dsh must admit dsh ${runtime}, which this package is built and verified against`,
  )
}

// 4) 必须拒绝契约未验证的版本线
for (const runtime of ['0.3.0']) {
  assert.ok(
    !satisfies(runtime, range),
    `engines.dsh must reject dsh ${runtime}`,
  )
}

console.log(`OK compatibility declaration checks passed (engines.dsh = ${range})`)
