import type { DefaultAuthOptions } from '../../options/authentication'
import type { GetContentsDataType } from '../types'
import { put, puts } from '../utils'

export function getAuthContents({ options }: GetContentsDataType): string {
  const authStrategies = (options.auth as DefaultAuthOptions).authStrategies!
  const jwt = authStrategies.includes('jwt')
  const local = authStrategies.includes('local')

  return `// ! Generated by nuxt-feathers - do not change manually
import type { Application } from './server'
import { useRuntimeConfig } from '#imports'
import { AuthenticationService ${put(jwt, `, JWTStrategy `)}} from '@feathersjs/authentication'
${put(local, `import { LocalStrategy } from '@feathersjs/authentication-local'`)}

export default function authentication(app: Application) {
  const authOptions = useRuntimeConfig().auth
  const authentication = new AuthenticationService(app, 'authentication', authOptions)

${puts([
  [jwt, `  authentication.register('jwt', new JWTStrategy())`],
  [local, `  authentication.register('local', new LocalStrategy())`],
])}

  app.use('authentication', authentication)
}

declare module './server' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}`
}
