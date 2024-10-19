import type { ModuleOptions } from '../../../module'
import type { Templates } from '../types'
import { getAuthContents } from './authentication'
import { getServerDeclarationContents } from './declarations'
import { getServerContents } from './server'

export function getServerTemplates(options: ModuleOptions): Templates {
  const serverTemplates: Templates = [
    {
      filename: 'feathers/server/server.ts',
      getContents: getServerContents,
      write: true,
      plugin: true,
    },
    {
      filename: 'feathers/server/declarations.ts',
      getContents: getServerDeclarationContents,
      write: true,
    },
  ]

  if (options.auth) {
    serverTemplates.push({
      filename: 'feathers/server/authentication.ts',
      getContents: getAuthContents,
      write: true,
    })
  }

  return serverTemplates
}
