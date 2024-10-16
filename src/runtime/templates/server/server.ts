import type { GetContentsDataType } from '../types'
import { createResolver } from '@nuxt/kit'
import { globSync } from 'glob'
import { hash } from 'ohash'

export function getServerContents({ nuxt, options }: GetContentsDataType): string {
  const resolver = createResolver(nuxt.options.rootDir)
  const modules = globSync(resolver.resolve(options.feathersDir!, './*.ts'))
  console.log('server modules', modules)

  return `import type { NitroApp } from 'nitropack'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import type { Application } from 'nuxt-feathers/runtime/declarations/server'
${modules.map(module => `import _${hash(module)} from '${module}';`).join('\n')}
  
export default defineNitroPlugin((nitroApp: NitroApp) => {
  nitroApp.hooks.hook('feathers:beforeSetup', async (app: Application) => {
    ${modules.map(module => `app.configure(_${hash(module)})`).join('\n    ')}
  })
})`
}
