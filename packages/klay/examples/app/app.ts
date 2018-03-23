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
  IDatabaseExecutor,
  IRouterMap,
  createAndMergeRouters,
} from '../../lib'
import {Permissions, configuration as authConf, AuthRoles} from './auth'
import {modelContext} from './model-context'
import {accountModel, AccountPlan, IAccount} from './models/account'
import {userModel, IUser} from './models/user'
import {omit, pick} from 'lodash'

const accountExecutor = kiln.build(ModelId.Account, sqlExtension) as IDatabaseExecutor<IAccount>
const userExecutor = kiln.build(ModelId.User, sqlExtension) as IDatabaseExecutor<IUser>

const routerMap: IRouterMap = {
  '/v1/accounts': {
    modelName: ModelId.Account,
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
            const account = await accountExecutor.create(
              {
                name: payload.name,
                slug: payload.slug,
                plan: AccountPlan.Gold,
              },
              {transaction},
            )

            const user = await userExecutor.create(
              {
                accountId: account.id!,
                email: payload.email,
                password: payload.password,
                role: AuthRoles.Admin,
                firstName: payload.firstName,
                lastName: payload.lastName,
              },
              {transaction},
            )

            return {account, user}
          })

          res.json(response)
        },
      },
    },
  },
  '/v1/users': {
    modelName: ModelId.User,
    readAuthorization: {permission: Permissions.UserView, criteria: [['accountId']]},
    writeAuthorization: {permission: Permissions.UserManage, criteria: [['accountId'], ['id']]},
    routes: CRUD_ROUTES,
  },
  '/v1/posts': {
    modelName: ModelId.Post,
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
  }
}

export const app: express.Express = express()
if (typeof (global as any).it === 'undefined') app.use(logger('short'))
app.use(json({strict: false}))
app.use(cookies())
app.use(authenticate(authConf))
app.use(createAndMergeRouters(kiln, routerMap).router)
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
    case 'ConstraintError':
      status = 400
       // TODO: convert ConstraintError to same JSON format
      body = pick(err, ['name', 'message', 'propertyPath', 'type'])
      break
    case 'AuthenticationError':
      status = 401
      break
    case 'AuthorizationError':
      status = 403
      body = {role: req.grants!.role!, grants: Array.from((req.grants as any)._grants)}
      break
    default:
      body = {message: err.message, stack: err.stack!.split('\n').slice(0, 5)}
  }

  res.status(status)
  if (body) res.json(body)
  res.end()
})
