import type { Nuxt } from '@nuxt/schema'
import type { ModuleOptions } from '../../module'
import { createResolver } from '@nuxt/kit'

export type ServicesDir = string
export type ServicesDirs = Array<ServicesDir>

export const servicesDirsDefaultOptions = ['services']

export function setServicesDirsDefaults(options: ModuleOptions, nuxt: Nuxt) {
  const resolver = createResolver(nuxt.options.rootDir)

  if (typeof options.servicesDirs === 'string' && options.servicesDirs)
    options.servicesDirs = [options.servicesDirs]
  if (!options.servicesDirs?.length)
    options.servicesDirs = servicesDirsDefaultOptions

  options.servicesDirs = (options.servicesDirs as ServicesDirs).map(dir =>
    resolver.resolve(dir),
  )
}
