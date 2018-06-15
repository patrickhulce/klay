/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import * as jwt from 'jsonwebtoken'
import {assert} from 'klay-core'
import {doPasswordsMatch} from 'klay-db'

import {AuthenticationError} from '../auth/authentication-error'
import {AuthorizationError} from '../auth/authorization-error'
import {Grants} from '../auth/grants'
import {getKilnUserAuthMetadata} from '../auth/utils'
import {
  IAnontatedHandler,
  IAuthConfiguration,
  IAuthCriteriaPropertyValues,
  IAuthorizationRequired,
  IKilnUserAuthMetadata,
} from '../typedefs'

const AUTH_BEARER_PATTERN = /^bearer (.*)/i

function createDecodeTokenFn(authConf: IAuthConfiguration): (req: Request) => Promise<any> {
  return async (req: Request): Promise<any> => {
    let token: string | undefined
    const authHeader = req.get('authorization')
    if (AUTH_BEARER_PATTERN.test(authHeader!)) {
      token = authHeader!.match(AUTH_BEARER_PATTERN)![1]
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) return undefined
    return new Promise<any>((resolve, reject) => {
      jwt.verify(token!, authConf.secret!, (err, unpacked) => {
        if (err) return reject(err)
        resolve(unpacked)
      })
    })
  }
}

function createDefaultGetUserContext(authConf: IAuthConfiguration): (req: Request) => Promise<any> {
  const decodeToken = authConf.secret ? createDecodeTokenFn(authConf) : (req: Request) => undefined
  return async (req: Request): Promise<any> => {
    const decodedToken = await decodeToken(req)
    if (decodedToken) return decodedToken

    const reqAsAny = req as any
    return reqAsAny.userContext || reqAsAny.user
  }
}

function defaultGetRoles(userContext: any): string[] | undefined {
  const role = userContext && userContext.role
  if (typeof role === 'string') return [role]
}

function defaultGetCurrentPassword(req: Request): string | undefined {
  const body = req.body || ({} as any)
  const passwordInHeader = req.get('x-current-password') || req.get('x-password')
  const passwordInBody = body.currentPassword || body.password
  return passwordInHeader || passwordInBody
}

export function createGrantCreationMiddleware(authConf: IAuthConfiguration): IAnontatedHandler {
  const getUserContext = authConf.getUserContext || createDefaultGetUserContext(authConf)
  const getRoles = authConf.getRoles || defaultGetRoles

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userContext = await getUserContext(req)
      const roles = await getRoles(userContext, req) // tslint:disable-line
      const grants = new Grants(roles, userContext, authConf)
      req.grants = grants
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function createPasswordValidationMiddleware(
  auth: Partial<IKilnUserAuthMetadata>,
): IAnontatedHandler {
  const {passwordField, passwordOptions} = getKilnUserAuthMetadata(auth)

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.grants) return next(new Error('Cannot validate grants without grant middleware'))
    if (!req.grants.userContext) return next(new AuthenticationError())

    try {
      const currentPassword = defaultGetCurrentPassword(req)
      assert.ok(currentPassword, 'did not send current password')

      const isValid = await doPasswordsMatch(
        currentPassword!,
        req.grants.userContext[passwordField],
        passwordOptions,
      )

      assert.ok(isValid, 'current password invalid')
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function createGrantValidationMiddleware(auth: IAuthorizationRequired): IAnontatedHandler {
  if (!auth.getAffectedCriteriaValues)
    throw new Error('Must define getAffectedCriteriaValues for grant validation')

  return function(req: Request, res: Response, next: NextFunction): void {
    if (!req.grants) return next(new Error('Cannot validate grants without grant middleware'))
    if (!req.grants.roles.length) return next(new AuthenticationError())

    const grants = req.grants
    if (grants.has(auth.permission)) return next()

    for (const criteriaProperties of grants.getPropertyNamesForPermission(auth.permission)) {
      const requiredPropertyValues: IAuthCriteriaPropertyValues[] = []
      // Loop through all criteria properties to build our criteria value objects
      for (const property of criteriaProperties) {
        // Route will return all the affected values for the given criteria property
        const values = auth.getAffectedCriteriaValues!(req, property)
        // Add the criteria property to the appropriate object
        values.forEach((value, i) => {
          requiredPropertyValues[i] = requiredPropertyValues[i] || {}
          requiredPropertyValues[i][property] = value
        })
      }

      // All of the properties must match to pass
      const passed = requiredPropertyValues.every(criteria => grants.has(auth.permission, criteria))
      // If any one of the criteria passes, the request is authorized
      if (passed) return next()
    }

    next(new AuthorizationError(auth.permission, req.grants))
  }
}
