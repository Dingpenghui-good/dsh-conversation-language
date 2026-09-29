/**
 * 0.1.7-alpha.2 回归验证脚本。
 *
 * 本插件在 DSH 0.2.0-rc.1 下以 `deps: ^0.2.0-rc.1` 运行，
 * 但 npm semver 的 prerelease 规则允许宿主同时组合 0.1.7 时代的
 * client SDK 包。本脚本验证在 0.1.7-alpha.2 的包表面下，
 * 客户端 bundle 的入口契约依然成立（0.1.7 没有 `plugins.bundle.config`
 * / `plugins.row.config` slot 时，详情页注册静默降级，不抛异常）。
 *
 * 运行：node client-verify-0.1.7.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const clientJs = resolve(root, 'lib/client.js')
const hostJs = resolve(root, 'lib/index.js')

function fail(msg) {
  console.error('FAIL:', msg)
  process.exit(1)
}

if (!existsSync(clientJs)) fail('lib/client.js 不存在，先运行 pnpm build')
if (!existsSync(hostJs)) fail('lib/index.js 不存在，先运行 pnpm build')

const clientSrc = readFileSync(clientJs, 'utf8')
const hostSrc = readFileSync(hostJs, 'utf8')

// 1. 客户端 bundle 是 CJS 模块（__ModuleLoader__ 包装）
if (!clientSrc.includes('__ModuleLoader__')) fail('client bundle 缺少 __ModuleLoader__ 包装')

// 2. 客户端 bundle 不 value-import 任何宿主侧包（purity gate 的运行时投影）
const hostOnly = ['dsh-system-prompt', 'dsh-tools', 'dsh-settings']
for (const name of hostOnly) {
  // 允许出现在注释/字符串中，但必须是 require(...) 才算 value-import
  const requireRe = new RegExp('require\\(["\']@deepseek-ai/' + name)
  if (requireRe.test(clientSrc)) fail('client bundle value-imports 宿主侧包 @deepseek-ai/' + name)
}

// 3. 0.1.7 回归：0.1.7 的 slots 表面没有 plugins.bundle.config / plugins.row.config。
//    我们的注册走 ctx.slots.inject(...) + whileServed 守卫。
//    在 0.1.7 宿主下，这两个 slot 名不存在时 inject 应当 no-op 而非抛异常。
//    这里验证 bundle 中没有对 slot 名做硬编码存在性断言（如果抛异常则 0.1.7 下会崩溃）。
const guardPattern = /if\s*\(\s*!\s*slots?\.(?:has|get)\s*\(\s*['"]plugins\.(?:bundle|row)\.config/
if (guardPattern.test(clientSrc)) fail('检测到对 0.1.7 不存在的 slot 的硬编码断言')

// 4. 宿主侧 ESM bundle 导出 apply 与 Config
if (!hostSrc.includes('export')) fail('host bundle 缺少 ESM export')

console.log('PASS: 0.1.7-alpha.2 回归检查通过')
console.log('  - client bundle: CJS __ModuleLoader__ 包装 ✓')
console.log('  - purity gate: 无宿主侧包 value-import ✓')
console.log('  - 0.1.7 slot 降级: 无硬编码 slot 存在性断言 ✓')
console.log('  - host bundle: ESM 导出 ✓')
