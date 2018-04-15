import * as express from 'express'
import {URL} from 'url'
import {IAnontatedHandler} from '../typedefs'

function isHTTPS(req: express.Request): boolean {
  if (req.get('x-appengine-https') === 'on') return true
  return req.protocol === 'https'
}

export function createAddFullURLMiddleware(): IAnontatedHandler {
  return function addFullURL(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void {
    const realHost = req.get('x-forwarded-host') || req.get('host') || 'unknown'
    const protocol = isHTTPS(req) ? 'https' : 'http'
    req.parsedURL = new URL(`${protocol}://${realHost}${req.originalUrl}`)
    next()
  }
}
