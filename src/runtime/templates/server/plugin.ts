import type { Import } from 'unimport'
import type { DefaultAuthOptions } from '../../options/authentication'
import type { ServicesDirs } from '../../options/services'
import type { RestTransportOptions, WebsocketTransportOptions } from '../../options/transports'
import type { GetContentsDataType } from '../types'
import { scanDirExports } from 'unimport'
import { filterExports, put, puts, setImportsMeta } from '../utils'

async function getServices(servicesDirs: ServicesDirs): Promise<Import[]> {
  const services = await scanDirExports(servicesDirs, {
    filePatterns: ['**/*.ts'],
    types: false,
  })
  return services
    .filter(({ from }) => !/\w+\.\w+\.ts$/.test(from)) // / !path.matchesGlob(from, '**/*.*.ts'), // path.matchesGlob is experimental
    .filter(filterExports)
}

export async function getServerPluginContents({ nuxt, options }: GetContentsDataType): Promise<string> {
  const services = setImportsMeta(await getServices(options.servicesDirs as ServicesDirs))

  const plugins = setImportsMeta(options.server!.plugins as Array<Import>)

  const modules = [...services, ...plugins]

  const transports = options?.transports
  const rest = !!transports?.rest
  const framework = (transports?.rest as RestTransportOptions)?.framework
  const exp = framework === 'express'
  const koa = framework === 'koa'
  const sio = !!transports?.websocket
  const routers = [exp && 'createExpressRouter', koa && 'createKoaRouter', sio && 'createSocketIoRouter'].filter(Boolean)
  const authStrategies = (options?.auth as DefaultAuthOptions)?.authStrategies
  const auth = (authStrategies || []).length > 0
  const authService = (options?.auth as DefaultAuthOptions)?.service
  const restPath = (transports?.rest as RestTransportOptions)?.path
  const websocketPath = (transports?.websocket as WebsocketTransportOptions)?.path

  return `// ! Generated by nuxt-feathers - do not change manually
import type { NitroApp } from 'nitropack'
import type { Application } from './server'
${put(options.loadFeathersConfig, `import configuration from '@feathersjs/configuration'`)}
import { feathers } from '@feathersjs/feathers'
${puts([
  [koa, `import { bodyParser, koa as feathersKoa, rest } from '@feathersjs/koa'`],
  [exp, `import feathersExpress, { json, rest, urlencoded } from '@feathersjs/express'`],
  [sio, `import socketio from '@feathersjs/socketio'`],
])}
${put(rest, `import { ${framework}ErrorHandler } from '@gabortorma/feathers-nitro-adapter/handlers'`)}
${put(auth, `import authentication from './authentication'`)}
import { ${routers.join(', ')} } from '@gabortorma/feathers-nitro-adapter/routers'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
${modules.map(module => module.meta.import).join('\n')}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const app: Application = ${puts([
    [koa, `feathersKoa(feathers())`],
    [exp, `feathersExpress(feathers())`],
    [!rest, `feathers()`],
  ])}
${put(options.loadFeathersConfig, `
  app.configure(configuration())
`)}
  // Add nitroApp to feathers app
  app.nitroApp = nitroApp;
${put(rest, `${put(koa, `
  // Set up Koa middleware
  app.configure(koaErrorHandler)
  app.use(bodyParser())`)}
${put(exp, `  // Set up Express middleware
  app.use(json())
  app.use(urlencoded({ extended: true }))
`)}
  ${put(rest, `// Init rest server
  app.set('framework', '${framework}')
  app.configure(rest(${put(auth, `{
    authentication: {
      strategies: ['${authStrategies?.join(`', '`)}'],
    },
  }`)}))  
`)}`)}
  // Init socket.io server for real-time functionality
  app.set('websocket', ${!!sio})${put(sio, `
  app.configure(socketio({ 
    path: '${websocketPath}',
    transports: ['websocket']
  }))`)}  

  ${put(auth, `// Init auth
  app.configure(authentication)`)}

  // Init services
  ${services.map(service => `app.configure(${service.meta.hash})`).join('\n  ')}

  // Init plugins
  ${plugins.map(plugin => `app.configure(${plugin.meta.hash})`).join('\n  ')}
${put(exp, `
  // Set up Express middleware for 404s and the error handler
  app.configure(expressErrorHandler)
`)}
  void app.setup().then(()=> { // TODO: make async in Nitro v3
${puts([
  [koa, `    // Init koa router\n    createKoaRouter(app, '${restPath}')`],
  [exp, `    // Init express router\n    createExpressRouter(app, '${restPath}')`],
  [sio, `    // Init socket.io router\n    createSocketIoRouter(app)`],
])}        
  }); 

  nitroApp.hooks.hook("close", async () => app.teardown());  
})
`
}
