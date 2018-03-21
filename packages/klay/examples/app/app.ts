import * as express from 'express'
import * as logger from 'morgan'
import {json} from 'body-parser'
import * as cookies from 'cookie-parser'

import {kiln, ModelId, sqlExtension} from './kiln'
import {
  IValidationError,
  ValidateIn,
  CRUD_ROUTES,
  EXPRESS_ROUTER,
  IRouter,
  IRouterOptions,
  ActionType,
  createGrantCreationMiddleware as authenticate,
} from '../../lib'
import {Permissions, configuration as authConf, AuthRoles} from './auth'
import {modelContext} from './model-context'
import {accountModel, AccountPlan} from './models/account'
import {userModel} from './models/user'
import {omit} from 'lodash'

// TODO: add types to SQLExecutor
const accountExecutor = kiln.build(ModelId.Account, sqlExtension)
const userExecutor = kiln.build(ModelId.User, sqlExtension)

const accountRoutes = kiln.build<IRouter, IRouterOptions>(ModelId.Account, EXPRESS_ROUTER, {
  readAuthorization: {permission: Permissions.AccountView, criteria: [['id']]},
  writeAuthorization: {permission: Permissions.AccountManage, criteria: [['id']]},
  routes: {
    ...CRUD_ROUTES,
    'POST /signup': {
      bodyModel: accountModel
        .clone()
        .pick(['name', 'slug'])
        .merge(userModel.clone().pick(['firstName', 'lastName', 'email', 'password'])),
      async handler(req: express.Request, res: express.Response) {
        const response = await accountExecutor.transaction(async transaction => {
          const payload = req.validated!.body
          const account = (await accountExecutor.create(
            {
              name: payload.name,
              slug: payload.slug,
              plan: AccountPlan.Gold,
            },
            {transaction},
          )) as any

          const user = await userExecutor.create(
            {
              ...omit(payload, ['name', 'slug']),
              accountId: account.id,
              role: AuthRoles.Admin,
            },
            {transaction},
          )

          return {account, user}
        })

        res.json(response)
      },
    },
  },
})

const userRoutes = kiln.build<IRouter, IRouterOptions>(ModelId.User, EXPRESS_ROUTER, {
  readAuthorization: {permission: Permissions.UserView, criteria: [['accountId']]},
  writeAuthorization: {permission: Permissions.UserManage, criteria: [['accountId'], ['id']]},
  routes: CRUD_ROUTES,
})

const postRoutes = kiln.build<IRouter, IRouterOptions>(ModelId.Post, EXPRESS_ROUTER, {
  readAuthorization: {permission: Permissions.PostManage, criteria: [['accountId']]},
  writeAuthorization: {permission: Permissions.PostManage, criteria: [['accountId']]},
  routes: {
    'GET /': {type: ActionType.List},
    'POST /search': {type: ActionType.List, expectQueryIn: ValidateIn.Body},

    'POST /': {type: ActionType.Create},
    'GET /:id': {type: ActionType.Read},
    'PUT /:id': {type: ActionType.Update},
    'DELETE /:id': {type: ActionType.Destroy},
  },
})

export const app: express.Express = express()
if (typeof (global as any).it === 'undefined') app.use(logger('short'))
app.use(json({strict: false}))
app.use(cookies())
app.use(authenticate(authConf))
app.use('/v1/accounts', accountRoutes.router)
app.use('/v1/users', userRoutes.router)
app.use('/v1/posts', postRoutes.router)
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!res.promise) return next()

  try {
    const result = await res.promise

    if (typeof result === 'undefined') {
      res.status(204)
      res.end()
    } else {
      res.json(result)
    }
  } catch (err) {
    next(err)
  }
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  let status = 500
  let body
  switch (err.name) {
    case 'ValidationError':
      status = 400
      body = ((err as any) as IValidationError).toJSON()
      break
    default:
      body = {message: err.message, stack: err.stack!.split('\n')}
  }

  res.status(status)
  if (body) res.json(body)
  res.end()
})
