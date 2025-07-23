// @vitest-environment node

import type { MessageData } from '../../services/messages/messages'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('express', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/server', import.meta.url)),
    nuxtConfig: {
      feathers: {
        auth: false,
        transports: {
          rest: {
            framework: 'express',
          },
          websocket: false,
        },
        server: {
          plugins: [
            '../../plugins/express.ts',
          ],
        },
      },
    },
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch<string>('/')
    expect(html).toContain('index')
  })

  it('renders the static feather-api page', async () => {
    const html = await $fetch('/feathers')
    expect(html).toContain('feathers-api')
  })

  it('get messages with $fetch', async () => {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-ignore TS2321
    const messages: MessageData[] = await $fetch('/feathers/messages')
    expect(messages.length).greaterThan(1)
  })
})
