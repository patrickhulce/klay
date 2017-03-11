const _ = require('lodash')

function defaultHandleError(results, req, res, next, options) {
  const status = _.get(options, 'status', 400)
  const toResponse = _.get(options, 'toResponse', _.identity)

  res.status(status)
  res.json(toResponse(results))
}

function createMiddleware(model, modelAsList, options) {
  const path = _.get(options, 'in', 'body')
  const handleError = _.get(options, 'handleError', defaultHandleError)
  const allowedAsList = _.get(options, 'allowedAsList', false)

  return function (req, res, next) {
    const source = req[path]
    const validated = req.validated = req.validated || {}
    const modelToUse = allowedAsList && _.isArray(source) ? modelAsList : model

    const results = modelToUse.validate(source)
    _.merge(validated, _.set({}, path, results.value))

    if (results.conforms) {
      next()
    } else {
      handleError(results, req, res, next, options)
    }
  }
}

module.exports = function () {
  return {
    name: 'express-validation',
    bake(modelDef, options) {
      options = options || {}

      let model = modelDef.model
      if (options.transform) {
        model = options.transform(model)
      } else if (options.omit) {
        model = model.omit(options.omit)
      } else if (options.pick) {
        model = model.pick(options.pick)
      }

      const modelAsList = model.constructor.construct({type: 'array', children: model}).required()
      const middleware = createMiddleware(model, modelAsList, options)
      middleware.model = model
      middleware.in = options.in || 'body'
      return middleware
    },
  }
}
