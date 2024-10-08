import type { GetContentsDataType } from './types'
import { createResolver } from '@nuxt/kit'
import { globSync } from 'glob'
import { hash } from 'ohash'

export function getFeathersServerContents({ nuxt }: GetContentsDataType): string {
  const resolver = createResolver(import.meta.url)
  const path = resolver.resolve(nuxt.options.serverDir, './feathers/*.ts')
  const modules = globSync(path)
  console.log('modules', modules)

  return `import type { NitroApp } from 'nitropack'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import type { Application } from '@gabortorma/nuxt-feathers'
${modules.map(module => `import _${hash(module)} from '${module}';`).join('\n')}
  
export default defineNitroPlugin((nitroApp: NitroApp) => {
  nitroApp.hooks.hook('feathers:beforeSetup', async (app: Application) => {
    ${modules.map(module => `_${hash(module)}(app)`).join('\n    ')}
  })
})`
}
