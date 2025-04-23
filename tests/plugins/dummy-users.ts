import type { HookContext, NextFunction } from 'nuxt-feathers/server'
import { defineFeathersServerPlugin } from 'nuxt-feathers/server'

export default defineFeathersServerPlugin((app) => {
  app.hooks({
    setup: [
      async (context: HookContext, next: NextFunction) => {
        console.log('Running dummy-users setup hook')
        await context.app.service('users').create([
          { userId: 'test', password: '12345' },
        ])
        await next()
      },
    ],
  })
})
