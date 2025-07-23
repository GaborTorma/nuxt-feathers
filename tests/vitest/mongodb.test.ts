// @vitest-environment node

import type { Paginated } from '@feathersjs/feathers'
import type { MongoData } from '../../services/mongos/mongos'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { MongoClient } from 'mongodb'
import { afterAll, describe, expect, it } from 'vitest'
import { setup as mongoSetup, teardown as mongoTeardown } from 'vitest-mongodb'

await mongoSetup() // create server before setup to get __MONGO_URI__ for nuxtConfig

describe('mongodb', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/mongo', import.meta.url)),
    nuxtConfig: {
      feathers: {
        database: {
          mongo: {
            url: __MONGO_URI__,
          },
        },
        transports: {
          websocket: false,
        },
      },
    },
  })

  afterAll(mongoTeardown)

  it('test mongodb memory server', () => {
    expect(async () => {
      const client = new MongoClient(__MONGO_URI__)
      try {
        const db = client.db('test')
        await db.command({ ping: 1 })
      }
      finally {
        await client.close()
      }
    }).not.toThrow()
  })

  it('get mongos with $fetch', async () => {
    const mongos: Paginated<MongoData> = await $fetch('/feathers/mongos')
    expect(mongos.total).greaterThanOrEqual(1)
  })
})
