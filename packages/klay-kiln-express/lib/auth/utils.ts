import {IModelChild} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'

import {DEFAULT_DATABASE_EXTENSION} from '../typedefs'

import {IKilnUserAuthMetadata} from './typedefs'

const DEFAULT_USER_MODEL_NAMES = ['user', 'account', 'login']
const DEFAULT_USERNAME_FIELDS = ['username', 'email', 'login', 'id']
const DEFAULT_PASSWORD_FIELDS = ['password', 'passphrase', 'pass']

export function getKilnUserAuthMetadata(
  options: Partial<IKilnUserAuthMetadata>,
): IKilnUserAuthMetadata {
  const {kiln, databaseExtensionName} = options
  if (!kiln) throw new Error('Must have kiln')

  const models = kiln.getModels()
  const modelName = DEFAULT_USER_MODEL_NAMES.find(
    name => !!models.find(model => model.name === name),
  )
  const userKilnModel = models.find(model => model.name === modelName)
  if (!userKilnModel) throw new Error('Must have user model for default lookup')

  const userModelChildren = userKilnModel.model.spec.children as IModelChild[]
  const userKeys = new Set(userModelChildren.map(child => child.path))
  const usernameField = DEFAULT_USERNAME_FIELDS.find(field => userKeys.has(field))
  const passwordField = DEFAULT_PASSWORD_FIELDS.find(field => userKeys.has(field))
  if (!usernameField || !passwordField)
    throw new Error('Unable to find username and password fields')

  const passwordModel = userModelChildren.find(model => model.path === passwordField)!.model
  const passwordOptions = passwordModel.spec.db && passwordModel.spec.db.password
  if (!passwordOptions) throw new Error('Unable to find password options')

  const executorExtension = databaseExtensionName || DEFAULT_DATABASE_EXTENSION
  const userExecutor = kiln.build<IDatabaseExecutor<any>>(userKilnModel.name, executorExtension)

  return {
    kiln,
    databaseExtensionName: executorExtension,
    usernameField,
    passwordField,
    passwordModel,
    passwordOptions,
    userKilnModel,
    userExecutor,
  }
}
