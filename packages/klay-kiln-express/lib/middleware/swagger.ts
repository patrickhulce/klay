import {Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {Spec as SwaggerSpec} from 'swagger-schema-official'
import {
  IAnontatedHandler,
  ISwaggerSpecMiddlewareOptions,
} from '../typedefs'

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
    const spec = {...rootSpec}

    if (autofillBasePath && req.parsedURL) {
      spec.basePath = req.parsedURL.pathname.replace(/\/[^\/]+$/i, '')
    }

    if (autofillHost && req.parsedURL) {
      spec.host = req.parsedURL.host
    }

    res.json(spec)
  }
}
