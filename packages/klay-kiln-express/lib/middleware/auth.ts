/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import * as jwt from 'jsonwebtoken'
import {defaultModelContext, IModel, IModelChild, ModelType} from 'klay-core'
import {AuthenticationError} from '../auth/authentication-error'
import {AuthorizationError} from '../auth/authorization-error'
import {Grants} from '../auth/grants'
import {
  IAnontatedHandler,
  IAuthConfiguration,
  IAuthCriteria,
  IAuthorizationRequired,
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

function defaultGetRole(userContext: any): string {
  return userContext && (userContext.role as string)
}

export function createGrantCreationMiddleware(authConf: IAuthConfiguration): IAnontatedHandler {
  const getUserContext = authConf.getUserContext || createDefaultGetUserContext(authConf)
  const getRole = authConf.getRole || defaultGetRole

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userContext = await getUserContext(req)
    const role = await getRole(userContext, req) // tslint:disable-line
    const grants = new Grants(role, userContext, authConf)
    req.grants = grants
    next()
  }
}

export function createGrantValidationMiddleware(auth: IAuthorizationRequired): IAnontatedHandler {
  if (!auth.getCriteriaValues) throw new Error('Must define getCriteriaValues for grant validation')

  return function(req: Request, res: Response, next: NextFunction): void {
    if (!req.grants) return next(new Error('Cannot validate grants without grant middleware'))
    if (!req.grants!.role) return next(new AuthenticationError())

    const grants = req.grants
    if (grants.has(auth.permission)) return next()

    for (const criteriaProperties of auth.criteria) {
      const requiredCriteria: IAuthCriteria[] = []
      for (const property of criteriaProperties) {
        const values = auth.getCriteriaValues!(req, property)
        values.forEach((value, i) => {
          requiredCriteria[i] = requiredCriteria[i] || {}
          requiredCriteria[i][property] = value
        })
      }

      const passed = requiredCriteria.every(criteria => grants.has(auth.permission, criteria))
      if (passed) return next()
    }

    next(new AuthorizationError(auth.permission, req.grants))
  }
}
