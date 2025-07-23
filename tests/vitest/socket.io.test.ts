// @vitest-environment node

import type { ClientApplication } from 'nuxt-feathers/client'
import type { Socket } from 'socket.io-client'
import type { Message } from '../../services/messages/messages'
import { fileURLToPath } from 'node:url'
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import { setup, url } from '@nuxt/test-utils/e2e'
import { io } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('socket.io', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/server', import.meta.url)),
    nuxtConfig: {
      feathers: {
        auth: false,
        transports: {
          rest: false,
        },
        server: {
          plugins: [
            '../../plugins/channels.ts',
          ],
        },
      },
    },
  })

  const feathersClient: ClientApplication = feathers()

  beforeAll(() => {
    const connection = socketio(io(url('/'), { transports: ['websocket'] }))
    feathersClient.configure(connection)
  })

  afterAll(async () => {
    await feathersClient.teardown()
  })

  it('get messages with featherClient', async () => {
    const messages = await feathersClient.service('messages').find({ paginate: false })
    expect(messages.length).greaterThan(1)
  })

  it('create message with featherClient', async () => {
    const message = await feathersClient.service('messages').create({ text: 'Hello' })
    const messages = await feathersClient.service('messages').find({
      query: {
        id: message.id,
      },
      paginate: false,
    })
    expect(messages.length).toBe(1)
  })

  it('on message created', async () => {
    const [received, created] = await Promise.all([
      new Promise(resolve => (feathersClient.io as Socket).on('messages created', resolve)),
      feathersClient.service('messages').create({ text: 'Hello' }),
    ])
    expect((received as Message)?.id).toBe(created?.id)
  })
})
