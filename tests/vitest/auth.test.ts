// @vitest-environment node

import type { ClientApplication } from 'nuxt-feathers/client'
import type { User, UserData } from '../../services/users/users'
import { fileURLToPath } from 'node:url'
import authenticationClient from '@feathersjs/authentication-client'
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import { setup, url } from '@nuxt/test-utils/e2e'
import { io } from 'socket.io-client'
import { afterAll, assert, beforeAll, describe, it } from 'vitest'

describe('authentication', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/server', import.meta.url)),
    nuxtConfig: {
      feathers: {
        auth: {
          authStrategies: ['local'],
        },
        servicesDirs: [
          '../../../services/users',
        ],
      },
    },
  })

  const feathersClient: ClientApplication = feathers()

  beforeAll(() => {
    const connection = socketio(io(url('/'), { transports: ['websocket'] }))
    feathersClient.configure(connection)
    feathersClient.configure(authenticationClient())
  })

  afterAll(async () => {
    await feathersClient.teardown()
  })

  const userData: UserData = {
    userId: 'test',
    password: 'test',
  }

  it('authenticate', async () => {
    const created = await feathersClient.service('users').create(userData)

    assert.ok(created, `Test user is created`)

    const { user, accessToken } = await feathersClient.authenticate({
      strategy: 'local',
      ...userData,
    })

    assert.ok(accessToken, 'Created access token for user')
    assert.ok(user, 'Includes user in authentication data')
    assert.strictEqual((user as User).password, undefined, 'Password is hidden to clients')

    await feathersClient.logout()
  })
})
