import type { Nuxt } from '@nuxt/schema'
import type { FeathersPublicRuntimeConfig, FeathersRuntimeConfig, ModuleConfig, ModuleOptions, ResolvedOptions } from './runtime/options'
import type { ClientOptions } from './runtime/options/client'
import type { PiniaModuleOptions } from './runtime/options/client/pinia'
import { addImports, addImportsDir, addPlugin, addServerPlugin, addTemplate, createResolver, defineNuxtModule, hasNuxtModule, installModule } from '@nuxt/kit'
import { consola } from 'consola'
import defu from 'defu'
import { resolveOptions, resolvePublicRuntimeConfig, resolveRuntimeConfig } from './runtime/options'
import { serverDefaults } from './runtime/options/server'
import { addServicesImports, getServicesImports } from './runtime/services'
import { getClientTemplates } from './runtime/templates/client'
import { getServerTemplates } from './runtime/templates/server'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    feathers?: ModuleConfig
  }

  interface RuntimeConfig {
    _feathers: FeathersRuntimeConfig
  }

  interface PublicRuntimeConfig {
    _feathers: FeathersPublicRuntimeConfig
  }
}

function setAliases(options: ResolvedOptions, nuxt: Nuxt) {
  const resolver = createResolver(import.meta.url)
  const aliases = {
    'nuxt-feathers/server': resolver.resolve(options.templateDir, 'server/server'),
    'nuxt-feathers/validators': resolver.resolve(options.templateDir, 'server/validators'),
    'nuxt-feathers/options': resolver.resolve('runtime/options'),
  }

  nuxt.options.alias = defu(nuxt.options.alias, aliases)
  if (options.client)
    nuxt.options.alias['nuxt-feathers/client'] = resolver.resolve(options.templateDir, 'client/client')

  nuxt.hook('nitro:config', async (nitroConfig) => {
    nitroConfig.alias = defu(nitroConfig.alias, aliases)
  })
}

function setTsIncludes(options: ResolvedOptions, nuxt: Nuxt) {
  const resolver = createResolver(import.meta.url)
  const servicesDirs = options.servicesDirs.map(dir => resolver.resolve(dir, '**/*.ts'))

  nuxt.hook('prepare:types', async ({ tsConfig }) => {
    tsConfig.include?.push(...servicesDirs)
  })

  nuxt.hook('nitro:config', (nitroConfig) => {
    nitroConfig.typescript?.tsConfig?.include?.push(...servicesDirs)
  })
}

async function loadPinia(client: ClientOptions) {
  const storesDirs = (client.pinia as PiniaModuleOptions)?.storesDirs
  if (storesDirs?.length) {
    if (hasNuxtModule('@pinia/nuxt'))
      return consola.warn('Pinia is already loaded, skipping your configuration')
    await installModule('@pinia/nuxt', { storesDirs })
  }
  if (!hasNuxtModule('@pinia/nuxt'))
    await installModule('@pinia/nuxt')
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-feathers',
    configKey: 'feathers',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    transports: {
      websocket: true,
    },
    server: serverDefaults,
    client: true,
    servicesDirs: [],
    validator: {
      formats: [],
      extendDefaults: true,
    },
    loadFeathersConfig: false,
    auth: true,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Prepare options

    const resolvedOptions: ResolvedOptions = await resolveOptions(options, nuxt)

    nuxt.options.runtimeConfig._feathers = resolveRuntimeConfig(resolvedOptions)
    nuxt.options.runtimeConfig.public._feathers = resolvePublicRuntimeConfig(resolvedOptions)

    const servicesImports = await getServicesImports(resolvedOptions.servicesDirs)
    await addServicesImports(servicesImports)

    // setAuthDefaults(ResolvedOptions, servicesImports, nuxt)

    // Prepare tsconfig
    setAliases(resolvedOptions, nuxt)
    setTsIncludes(resolvedOptions, nuxt)

    if (resolvedOptions.transports.websocket) {
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.experimental = defu(nitroConfig.experimental, { websocket: true })
      })
    }

    addImportsDir(resolver.resolve('./runtime/composables')) // TODO: separate feathers-pinia imports

    for (const serverTemplate of getServerTemplates(resolvedOptions))
      addTemplate({ ...serverTemplate, options: resolvedOptions })
    addServerPlugin(resolver.resolve(resolvedOptions.templateDir, 'server/plugin'))

    if (resolvedOptions.client) {
      const clientOptions = resolvedOptions.client as ClientOptions
      if (clientOptions.pinia) {
        await loadPinia(clientOptions)
        nuxt.hook('vite:extendConfig', (config) => {
          config.optimizeDeps?.include?.push('@gabortorma/feathers-pinia')
        })
        if (resolvedOptions.auth) {
          addImports({ from: resolver.resolve('./runtime/stores/auth'), name: 'useAuthStore' })
          addPlugin({ order: 1, src: resolver.resolve('./runtime/plugins/feathers-auth') })
        }
      }
      for (const clientTemplate of getClientTemplates(resolvedOptions, resolver))
        addTemplate({ ...clientTemplate, options: resolvedOptions })
      addPlugin({ order: 0, src: resolver.resolve(resolvedOptions.templateDir, 'client/plugin') })
    }
  },
})
