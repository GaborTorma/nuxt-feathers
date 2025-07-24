import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: [
      './src/runtime/options/**/*.test.ts',
      './tests/vitest/*.test.ts',
    ],
  },
})
