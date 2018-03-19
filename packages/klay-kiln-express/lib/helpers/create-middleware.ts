/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {Grants} from '../auth/grants'
import {
  IAnontatedHandler,
  IAuthConfiguration,
  IAuthCriteria,
  IAuthorizationRequired,
  IValidationMiddlewareOptions,
  ValidateIn,
} from '../typedefs'

export function createValidationMiddleware(
  model: IModel,
  pathInReq: ValidateIn = ValidateIn.Body,
  options: IValidationMiddlewareOptions = {},
): IAnontatedHandler {
  const arrayModel = options.allowedAsList && defaultModelContext.array().children(model)

  return function(req: Request, res: Response, next: NextFunction): void {
    const sourceData = req[pathInReq]
    const validated = req.validated || {}
    const result =
      arrayModel && Array.isArray(sourceData)
        ? arrayModel.validate(sourceData)
        : model.validate(sourceData)
    validated[pathInReq] = result.value
    req.validated = validated

    if (result.conforms) {
      next()
    } else {
      next(result.toError())
    }
  }
}

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
    if (!req.grants) throw new Error('Cannot validate grants without grant middleware')

    const grants = req.grants
    if (grants.hasGlobal(auth.permission)) return next()

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

    throw new Error(`Lacking permission ${auth.permission}`)
  }
}
