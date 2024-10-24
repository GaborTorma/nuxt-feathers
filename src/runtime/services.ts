import type { ServicesDirs } from './options/services'
import { addImports, addServerImports } from '@nuxt/kit'
import { scanDirExports } from 'unimport'

export async function addServicesImports(servicesDirs: ServicesDirs) {
  const exports = await scanDirExports(servicesDirs, {
    filePatterns: ['*/*.schema.ts'],
  })
  const typeExports = exports.filter(({ type }) => type)
  console.log('Services typeExports', typeExports.map(({ as }) => as))
  addImports(typeExports)
  addServerImports(typeExports)
}
