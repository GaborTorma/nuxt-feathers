import { fileURLToPath } from 'node:url'
import { expect } from '@nuxt/test-utils/playwright'
import { test } from '../../playwright-defaults'

test.use({
  nuxt: {
    rootDir: fileURLToPath(new URL('../fixtures/client', import.meta.url)),
    nuxtConfig: {
      feathers: {
        auth: false,
        client: {
          pinia: false,
        },
      },
    },
  },
})

test('index page', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'load' })
  await expect(page.getByRole('heading')).toHaveText('index')
})

test('messages', async ({ page, goto }) => {
  await goto('/messages', { waitUntil: 'hydration' })
  //  await page.waitForSelector('[data-testid="message-0"]')
  await expect(page.getByTestId('message-0')).toContainText('Hello from the dummy setup hook!')
})
