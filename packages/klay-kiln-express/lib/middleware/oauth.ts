/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import * as jwt from 'jsonwebtoken'

import {IModel, defaultModelContext} from 'klay-core'
import {doPasswordsMatch} from 'klay-db'

import {AuthenticationError} from '../auth/authentication-error'
import {getKilnUserAuthMetadata} from '../auth/utils'
import {IAnontatedHandler, IOAuthOptions} from '../typedefs'

function createDefaultLookupByPassword(
  options: IOAuthOptions,
): (u: string, p: string) => Promise<any> {
  const {userExecutor, usernameField, passwordField, passwordOptions} = getKilnUserAuthMetadata(
    options,
  )
  return async (username: string, password: string) => {
    const user = (await userExecutor.findOne({where: {[usernameField]: username}})) as any
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
