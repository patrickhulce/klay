import * as express from 'express'
import * as logger from 'morgan'
import {json} from 'body-parser'

import {IValidationError} from '../../lib'
import {kiln, ModelId} from './kiln'
import {CRUD_ROUTES, EXPRESS_ROUTER, IRouter} from '../../lib'

const userRoutes = kiln.build(ModelId.User, EXPRESS_ROUTER, {routes: CRUD_ROUTES}) as IRouter

export const app: express.Express = express()
if (typeof (global as any).it === 'undefined') app.use(logger('short'))
app.use(json({strict: false}))
app.use('/v1/users', userRoutes.router)
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
      body = (err as any as IValidationError).toJSON()
      break
    default:
      body = {message: err.message, stack: err.stack!.split('\n')}
  }

  res.status(status)
  if (body) res.json(body)
  res.end()
})
