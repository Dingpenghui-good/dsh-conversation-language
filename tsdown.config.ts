import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/client/index.ts'],
  dts: true,
  sourcemap: true,
  clean: true,
  format: ['esm'],
  target: 'node18',
  outDir: 'lib',
})
