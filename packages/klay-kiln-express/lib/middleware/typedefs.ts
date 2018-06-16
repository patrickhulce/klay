import * as express from 'express'

export interface IErrorMiddlewareOptions {
  exposeStackTrace?: boolean
  defaultHandler?: boolean | express.ErrorRequestHandler
}
