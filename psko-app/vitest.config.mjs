import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/*.route.test.ts', 'node_modules/**'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      // Scope coverage to clinical engine modules — the area this spec hardens.
      include: ['src/lib/clinical/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'src/lib/clinical/frameworks/**'],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Disable vite dep pre-bundling to bypass esbuild service deadlock
    disabled: true,
  },
})
