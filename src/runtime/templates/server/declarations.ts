import type { RestTransportOptions } from '../../options/transports'
import type { GetContentsDataType } from '../types'
import { put, puts } from '../utils'

export function getServerDeclarationContents({ nuxt, options }: GetContentsDataType): string {
  const transports = options?.transports
  const noRest = !transports?.rest
  const exp = (transports?.rest as RestTransportOptions).framework === 'express'
  const koa = (transports?.rest as RestTransportOptions).framework === 'koa'

  return `// ! Generated by nuxt-feathers - do not change manually
import type { ${put(noRest, `Application as FeathersApplication, `)}HookContext as FeathersHookContext, NextFunction } from '@feathersjs/feathers'
${puts([
  [koa, `import type { Application as FeathersApplication } from '@feathersjs/koa'`],
  [exp, `import type { Application as FeathersApplication } from '@feathersjs/express'`],
])}
// import type { ModuleOptions } from '???'
import type { NitroApp } from 'nitropack'

export type { NextFunction }

export interface Configuration {
  framework?: 'express' | 'koa'
  websocket?: boolean
}

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {}

export interface ApplicationAddons {
  nitroApp?: NitroApp
  // moduleOptions: ModuleOptions
}

// The application instance type that will be used everywhere else
export type Application = FeathersApplication<ServiceTypes, Configuration> & ApplicationAddons

// The context for hook functions - can be typed with a service class
export type HookContext<S = any> = FeathersHookContext<Application, S>
`
}
