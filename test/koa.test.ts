/* eslint-disable ts/no-unsafe-assignment */

import type { MessageData } from '#imports'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('koa', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/koa', import.meta.url)),
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('index')
  })

  it('renders the static feather-api page', async () => {
    const html = await $fetch('/feathers')
    expect(html).toContain('feathers-api')
  })

  it('get messages with $fetch', async () => {
    const messages: MessageData[] = await $fetch('/feathers/messages')
    expect(messages.length).greaterThan(1)
  })
})
