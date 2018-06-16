import * as express from 'express'
import {IValidationError} from 'klay-core'
import {pick} from 'lodash'

import {IAnontatedHandler} from '../typedefs'

import {IErrorMiddlewareOptions} from './typedefs'

export function createHandleErrorMiddleware(
  options: IErrorMiddlewareOptions = {},
): express.ErrorRequestHandler {
  options = {
    exposeStackTrace: false,
    defaultHandler: true,
    ...options,
  }

  return function handleError(
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void {
    let status: number
    let body: any

    // TODO: standardize errors, https://github.com/patrickhulce/klay/issues/96
    switch (err.name) {
      case 'AssertionError':
        status = 400
        body = pick(err, ['name', 'message'])
        break
      case 'ValidationError':
        status = 400
        body = ((err as any) as IValidationError).toJSON()
        break
      case 'ConstraintError':
        // TODO: convert these to same JSON format
        status = 400
        body = pick(err, ['name', 'message', 'propertyPath', 'type'])
        break
      case 'AuthenticationError':
        status = 401
        break
      case 'AuthorizationError':
        // TODO: don't expose private state here
        status = 403
        body = {roles: req.grants!.roles, grants: Array.from((req.grants as any)._grants)}
        break
      default:
        if (options.defaultHandler === true) {
          const stack = options.exposeStackTrace ? err.stack!.split('\n').slice(0, 5) : undefined
          status = 500
          body = {message: err.message, stack}
        } else if (typeof options.defaultHandler === 'function') {
          return options.defaultHandler(err, req, res, next)
        } else {
          return next(err)
        }
    }

    res.status(status)
    if (body) {
      res.body = body
      res.json(body)
    }

    res.end()
  }
}

export function createHandlePromiseMiddleware(): IAnontatedHandler {
  return async function handlePromise(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> {
    if (!res.promise) return next()

    try {
      const result = await res.promise

      if (typeof result === 'undefined') {
        res.status(204)
        res.end()
      } else {
        res.body = result
        res.json(result)
      }
    } catch (err) {
      next(err)
    }
  }
}
