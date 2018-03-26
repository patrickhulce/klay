/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {Spec as SwaggerSpec} from 'swagger-schema-official'
import {AuthenticationError} from '../auth/authentication-error'
import {AuthorizationError} from '../auth/authorization-error'
import {Grants} from '../auth/grants'
import {
  IAnontatedHandler,
  IAuthConfiguration,
  IAuthCriteria,
  IAuthorizationRequired,
  ISwaggerSpecMiddlewareOptions,
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

export function createSwaggerUIHandler(spec: SwaggerSpec, swaggerPath: string): IAnontatedHandler {
  return function(req: Request, res: Response): void {
    const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/3.13.1'
    res.set('content-type', 'text/html')
    res.send(`
      <html>
      <head>
        <title>${spec.info.title} API Documentation</title>
        <link rel="stylesheet" type="text/css" href="${cdn}/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="${cdn}/swagger-ui-bundle.js"></script>
        <script src="${cdn}/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function () {
            window.ui = SwaggerUIBundle({
              url: new URL("${swaggerPath}", window.location.href).href,
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            })
          }
        </script>
    `)
    res.end()
  }
}

export function createSwaggerSpecHandler(
  rootSpec: SwaggerSpec,
  options?: ISwaggerSpecMiddlewareOptions,
): IAnontatedHandler {
  const {autofillBasePath = true, autofillHost = true} = options || {}

  return function(req: Request, res: Response): void {
    let spec = rootSpec

    if (autofillBasePath) {
      spec = {...rootSpec, basePath: req.originalUrl.replace(/\/[^\/]+$/i, '')}
    }

    const host = req.get('host')
    if (autofillHost && host) {
      spec = {...rootSpec, host}
    }

    res.json(spec)
  }
}
