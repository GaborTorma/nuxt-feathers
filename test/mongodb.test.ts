import { MongoClient } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, teardown } from 'vitest-mongodb'

describe('koa', async () => {
  beforeAll(async () => {
    await setup()
  })

  afterAll(async () => {
    await teardown()
  })

  it('connects to mongodb', () => {
    expect(async () => {
      const client = new MongoClient(globalThis.__MONGO_URI__)
      try {
        const db = client.db('test')
        await db.command({ ping: 1 })
      }
      finally {
        await client.close()
      }
    }).not.toThrow()
  })
})
