// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html

import type { Static } from '@feathersjs/typebox'
import type { HookContext } from 'nuxt-feathers/server'
import type { UserService } from './users.class'
import { passwordHash } from '@feathersjs/authentication-local'
import { resolve } from '@feathersjs/schema'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from 'nuxt-feathers/validators'

// Main data model schema
export const userSchema = Type.Object(
  {
    id: Type.Number(),
    userId: Type.String(),
    password: Type.Optional(Type.String()),
  },
  { $id: 'User', additionalProperties: false },
)
export type User = Static<typeof userSchema>
export const userValidator = getValidator(userSchema, dataValidator)
export const userResolver = resolve<User, HookContext<UserService>>({})

export const userExternalResolver = resolve<User, HookContext<UserService>>({
  // The password should never be visible externally
  password: async () => undefined,
})

// Schema for creating new entries
export const userDataSchema = Type.Pick(userSchema, ['userId', 'password'], {
  $id: 'UserData',
})
export type UserData = Static<typeof userDataSchema>
export const userDataValidator = getValidator(userDataSchema, dataValidator)
export const userDataResolver = resolve<User, HookContext<UserService>>({
  password: passwordHash({ strategy: 'local' }),
})

// Schema for updating existing entries
export const userPatchSchema = Type.Partial(userSchema, {
  $id: 'UserPatch',
})
export type UserPatch = Static<typeof userPatchSchema>
export const userPatchValidator = getValidator(userPatchSchema, dataValidator)
export const userPatchResolver = resolve<User, HookContext<UserService>>({
  password: passwordHash({ strategy: 'local' }),
})

// Schema for allowed query properties
export const userQueryProperties = Type.Pick(userSchema, ['id', 'userId'])
export const userQuerySchema = Type.Intersect(
  [
    querySyntax(userQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type UserQuery = Static<typeof userQuerySchema>
export const userQueryValidator = getValidator(userQuerySchema, queryValidator)
export const userQueryResolver = resolve<UserQuery, HookContext<UserService>>({
  // If there is a user (e.g. with authentication), they are only allowed to see their own data
  id: async (value, user, context) => {
    if (context.params.user) {
      return context.params.user.id
    }

    return value
  },
})
