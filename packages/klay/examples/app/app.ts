import {json} from 'body-parser'
import * as cookies from 'cookie-parser'
import * as express from 'express'
import {pick} from 'lodash'
import * as logger from 'morgan'

import {
  ActionType,
  CRUD_ROUTES,
  IDatabaseExecutor,
  IRouterMap,
  IValidationError,
  ValidateIn,
  createAndMergeRouters,
  createGrantCreationMiddleware as authenticate,
  createHandleErrorMiddleware,
  createHandlePromiseMiddleware,
  createOAuthTokenHandler,
  oauthTokenRequestModel,
  oauthTokenResponseModel,
} from '../../lib'

import {AuthRoles, Permissions, SECRET, configuration as authConf} from './auth'
import {ModelId, kiln, sqlExtension} from './kiln'
import {modelContext} from './model-context'
import {AccountPlan, IAccount, accountModel} from './models/account'
import {IUser, userModel} from './models/user'

const accountExecutor = kiln.build(ModelId.Account, sqlExtension) as IDatabaseExecutor<IAccount>
const userExecutor = kiln.build(ModelId.User, sqlExtension) as IDatabaseExecutor<IUser>

const routerMap: IRouterMap = {
  '/v1/oauth': {
    routes: {
      'POST /token': {
        bodyModel: oauthTokenRequestModel,
        responseModel: oauthTokenResponseModel,
        handler: createOAuthTokenHandler({secret: SECRET, kiln}),
      },
    },
  },
  '/v1/accounts': {
    modelName: ModelId.Account,
    routes: {
      ...CRUD_ROUTES,
      'POST /signup': {
        bodyModel: accountModel
          .clone()
          .pick(['name', 'slug'])
          .merge(userModel.clone().pick(['firstName', 'lastName', 'email', 'password'])),
        // TODO: test that errors thrown here get proper response codes set
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
    routes: {
      'POST /': {
        type: ActionType.Create,
        authorization: {permission: Permissions.UserCreate},
      },
      'POST /bulk': {
        type: ActionType.Create,
        byList: true,
        authorization: {permission: Permissions.UserCreate},
      },
      'PUT /:id/profile': {
        type: ActionType.Patch,
        authorization: {permission: Permissions.UserProfile},
        patchProperties: ['firstName', 'lastName'],
      },
      'PUT /:id/password': {
        type: ActionType.Patch,
        authorization: {permission: Permissions.UserPassword},
        patchProperties: ['password'],
      },
      'GET /': {type: ActionType.List},
      'POST /search': {type: ActionType.List, expectQueryIn: ValidateIn.Body},

      'GET /:id': {type: ActionType.Read},
      'PUT /:id': {type: ActionType.Update},
      'PUT /bulk': {type: ActionType.Update, byId: false, byList: true},
      'DELETE /:id': {
        type: ActionType.Destroy,
        authorization: {permission: Permissions.UserCreate},
      },
      'DELETE /bulk': {
        type: ActionType.Destroy,
        byId: false,
        byList: true,
        authorization: {permission: Permissions.UserCreate},
      },
    },
  },
  '/v1/posts': {
    modelName: ModelId.Post,
    routes: {
      'GET /': {type: ActionType.List},
      'POST /search': {type: ActionType.List, expectQueryIn: ValidateIn.Body},

      'POST /': {type: ActionType.Create},
      'GET /:id': {type: ActionType.Read},
      'PUT /:id': {type: ActionType.Update},
      'DELETE /:id': {type: ActionType.Destroy},
    },
  },
}

export const app: express.Express = express()
if (typeof (global as any).it === 'undefined') app.use(logger('short'))
app.use(json({strict: false}))
app.use(cookies())
app.use(authenticate(authConf))
app.use(createAndMergeRouters(kiln, routerMap).router)
app.use(createHandlePromiseMiddleware())
app.use(createHandleErrorMiddleware())
