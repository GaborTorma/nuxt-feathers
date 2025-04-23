import type { CreatePiniaClientConfig, PiniaServiceConfig } from '@gabortorma/feathers-pinia'
import type { ModuleOptions as PiniaNuxtModuleOptions } from '@pinia/nuxt'
import { klona } from 'klona'

export type PiniaModuleOptions = Pick<PiniaNuxtModuleOptions, 'storesDirs'>

export type removableServiceOptions = 'customizeStore' | 'handleEvents' | 'setupInstance' | 'customFilters' | 'customSiftOperators'

export type SerializablePiniaServiceConfig = Omit<PiniaServiceConfig, removableServiceOptions>

export interface SerializablePiniaClientOptions extends Partial<Omit<CreatePiniaClientConfig, 'pinia' | 'services' | 'storage' | removableServiceOptions>> {
  services?: Record<string, SerializablePiniaServiceConfig>
}

export type PiniaOptions = SerializablePiniaClientOptions & PiniaModuleOptions

export type ResolvedPiniaOptions = Required<Pick<PiniaOptions, 'storesDirs' | 'idField'>> & Omit<PiniaOptions, 'storesDirs' | 'idField'>

export type ResolvedPiniaOptionsOrDisabled = ResolvedPiniaOptions | false

export const piniaDefaults: ResolvedPiniaOptions = {
  storesDirs: ['stores'],
  idField: 'id', // use _id for mongoDB
}

export function getPiniaDefaults(): ResolvedPiniaOptions {
  return klona(piniaDefaults)
}

export function resolvePiniaOptions(piniaOptions: PiniaOptions | boolean | undefined): ResolvedPiniaOptionsOrDisabled {
  let pinia: ResolvedPiniaOptionsOrDisabled = false

  const piniaDefaultOptions = getPiniaDefaults()

  if (piniaOptions === true || piniaOptions === undefined)
    pinia = piniaDefaultOptions
  else if (piniaOptions !== false)
    pinia = { ...piniaDefaultOptions, ...piniaOptions }

  return pinia
}
