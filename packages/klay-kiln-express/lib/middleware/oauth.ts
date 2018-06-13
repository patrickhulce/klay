/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import * as jwt from 'jsonwebtoken'

import {IModel, IModelChild, defaultModelContext} from 'klay-core'
import {IDatabaseExecutor, doPasswordsMatch} from 'klay-db'

import {AuthenticationError} from '../auth/authentication-error'
import {DEFAULT_DATABASE_EXTENSION, IAnontatedHandler, IOAuthOptions} from '../typedefs'

const DEFAULT_USER_MODEL_NAMES = ['user', 'account', 'login']
const DEFAULT_USERNAME_FIELDS = ['username', 'email', 'login', 'id']
const DEFAULT_PASSWORD_FIELDS = ['password', 'passphrase', 'pass']

function createDefaultLookupByPassword(
  options: IOAuthOptions,
): (u: string, p: string) => Promise<any> {
  const {kiln, databaseExtension} = options
  if (!kiln) throw new Error('Must have kiln for default lookup')

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

  const executorExtension = databaseExtension || DEFAULT_DATABASE_EXTENSION
  const executor = kiln.build<IDatabaseExecutor<any>>(userKilnModel.name, executorExtension)
  return async (username: string, password: string) => {
    const user = await executor.findOne({where: {[usernameField]: username}})
    if (!user) return undefined
    const passwordsMatch = await doPasswordsMatch(password, user[passwordField], passwordOptions)
    if (!passwordsMatch) return undefined
    // TODO: limit returned user fields to just those used by auth grants
    return user
  }
}

// see https://tools.ietf.org/html/rfc6749#section-4.3.1
export const oauthTokenRequestModel: IModel = defaultModelContext.object().children({
  // TODO: handle other grant types
  grant_type: defaultModelContext
    .string()
    .required()
    .enum(['password']),
  username: defaultModelContext.string().required(),
  password: defaultModelContext.string().required(),
})

export const oauthTokenResponseModel: IModel = defaultModelContext.object().children({
  access_token: defaultModelContext.string().required(),
  token_type: defaultModelContext
    .string()
    .required()
    .enum(['bearer']),
  expires_in: defaultModelContext.integer().required(),
})

export function createOAuthTokenHandler(options: IOAuthOptions): IAnontatedHandler {
  const lookupUserContextByPassword =
    options.lookupUserContextByPassword || createDefaultLookupByPassword(options)

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {username, password} = req.body
    const userContext = await lookupUserContextByPassword(username, password)
    if (!userContext) return next(new AuthenticationError())

    // TODO: use async jwt.sign
    const expiresIn = 14 * 24 * 60 * 60
    const token = jwt.sign(userContext, options.secret, {expiresIn})

    // tslint:disable-next-line
    if (typeof res.cookie === 'function') {
      res.cookie('token', token, {
        path: '/',
        httpOnly: true,
        maxAge: expiresIn * 1000,
      })
    }

    res.json({
      access_token: token,
      token_type: 'bearer',
      expires_in: expiresIn,
    })
  }
}
