/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {AuthenticationError} from '../auth/authentication-error'
import {AuthorizationError} from '../auth/authorization-error'
import {Grants} from '../auth/grants'
import {
  IAnontatedHandler,
  IAuthConfiguration,
  IAuthCriteria,
  IAuthorizationRequired,
} from '../typedefs'

export function createGrantCreationMiddleware(authConf: IAuthConfiguration): IAnontatedHandler {
  const getUserContext = authConf.getUserContext || ((req: Request) => (req as any).user)
  const getRole = authConf.getRole || ((ctx: any) => ctx && (ctx.role as string))

  return function(req: Request, res: Response, next: NextFunction): void {
    const userContext = getUserContext(req)
    const role = getRole(userContext, req)
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
