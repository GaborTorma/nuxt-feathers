import type { Nuxt } from '@nuxt/schema'
import { addImportsDir, addPlugin, addServerPlugin, addTemplate, createResolver, defineNuxtModule, hasNuxtModule, installModule } from '@nuxt/kit'
import consola from 'consola'
import defu from 'defu'
import { type AuthOptions, type PublicAuthOptions, setAuthDefaults } from './runtime/options/authentication'
import { type ClientOptions, setClientsDefaults } from './runtime/options/client'
import { type ServicesDir, type ServicesDirs, setDirectoriesDefaults } from './runtime/options/directories'
import { setTransportsDefaults, type TransportsOptions } from './runtime/options/transports'
import { setValidatorFormatsDefaults, type ValidatorOptions } from './runtime/options/validator'
import { addServicesImports } from './runtime/services'
import { getClientTemplates } from './runtime/templates/client'
import { getServerTemplates } from './runtime/templates/server'

// Module options TypeScript interface definition
export interface ModuleOptions {
  transports: TransportsOptions
  servicesDirs: ServicesDir | ServicesDirs
  feathersDir: string
  auth: AuthOptions | boolean
  client: ClientOptions | boolean
  validator: ValidatorOptions
  loadFeathersConfig: boolean
}

export type ModuleConfig = Partial<ModuleOptions>

declare module '@nuxt/schema' {
  interface NuxtConfig {
    feathers?: ModuleConfig
  }

  interface RuntimeConfig {
    auth: AuthOptions | boolean
  }

  interface PublicRuntimeConfig {
    transports: TransportsOptions
    auth: PublicAuthOptions | undefined
  }
}

function setAliases(options: ModuleOptions, nuxt: Nuxt) {
  const resolver = createResolver(import.meta.url)
  const aliases = {
    'nuxt-feathers/server': resolver.resolve(nuxt.options.buildDir, './feathers/server/declarations'),
    'nuxt-feathers/validators': resolver.resolve(nuxt.options.buildDir, './feathers/server/validators'),
    'nuxt-feathers/options': resolver.resolve('./runtime/options'),
  }

  nuxt.options.alias = defu(nuxt.options.alias, aliases)
  if (options.client)
    nuxt.options.alias['nuxt-feathers/client'] = resolver.resolve(nuxt.options.buildDir, './feathers/client/client')

  nuxt.hook('nitro:config', (nitroConfig) => {
    nitroConfig.alias = defu(nitroConfig.alias, aliases)
  })
}

function setTsIncludes(options: ModuleOptions, nuxt: Nuxt) {
  const resolver = createResolver(import.meta.url)
  const servicesDirs = (options.servicesDirs as ServicesDirs).map(dir => resolver.resolve(dir, '**/*.ts'))

  nuxt.hook('prepare:types', async ({ tsConfig }) => {
    tsConfig.include?.push(...servicesDirs)
  })

  nuxt.hook('nitro:config', (nitroConfig) => {
    nitroConfig.typescript?.tsConfig?.include?.push(...servicesDirs)
  })
}

async function loadPinia(client: ClientOptions) {
  if (typeof client.pinia === 'object') {
    if (hasNuxtModule('@pinia/nuxt'))
      return consola.warn('Pinia is already loaded, skipping your configuration')
    await installModule('@pinia/nuxt', client.pinia)
  }
  if (!hasNuxtModule('@pinia/nuxt'))
    await installModule('@pinia/nuxt')
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-feathers',
    configKey: 'feathers',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: (nuxt) => {
    const resolver = createResolver(import.meta.url)
    return {
      transports: {
        websocket: true,
      },
      validator: {
        formats: [],
        extendDefaults: true,
      },
      feathersDir: resolver.resolve(nuxt.options.serverDir, './feathers'),
      servicesDirs: [],
      pinia: true,
      loadFeathersConfig: false,
      auth: true,
    }
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Prepare options
    setDirectoriesDefaults(options, nuxt)
    setTransportsDefaults(options.transports, nuxt)
    setAuthDefaults(options, nuxt)
    setValidatorFormatsDefaults(options.validator, nuxt)
    setClientsDefaults(options, nuxt)

    // Prepare tsconfig
    setAliases(options, nuxt)
    setTsIncludes(options, nuxt)

    if (options.transports.websocket) {
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.experimental = defu(nitroConfig.experimental, { websocket: true })
      })
    }

    if (options.client) {
      const clientOptions = options.client as ClientOptions
      const plugins = resolver.resolve('./runtime/plugins')
      if (clientOptions.pinia) {
        await loadPinia(clientOptions)
        addImportsDir(resolver.resolve('./runtime/stores/*.ts'))
        nuxt.hook('vite:extendConfig', (config) => {
          config.optimizeDeps?.include?.push('feathers-pinia')
        })
        if (options.auth)
          addPlugin({ order: 1, src: resolver.resolve(plugins, 'feathers-auth') })
      }
      addPlugin({ order: 0, src: resolver.resolve(plugins, 'feathers-client') })
    }
    addImportsDir(resolver.resolve('./runtime/composables')) // TODO: separate feathers-pinia imports

    await addServicesImports(options.servicesDirs as ServicesDirs)

    if (options.client) {
      for (const clientTemplate of getClientTemplates(options)) {
        addTemplate({ ...clientTemplate, options })
        if (clientTemplate.plugin)
          addPlugin(resolver.resolve(nuxt.options.buildDir, clientTemplate.filename))
      }
    }
    for (const serverTemplate of getServerTemplates(options)) {
      addTemplate({ ...serverTemplate, options })
      if (serverTemplate.plugin)
        addServerPlugin(resolver.resolve(nuxt.options.buildDir, serverTemplate.filename))
    }
  },
})
