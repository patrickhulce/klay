const assert = require('assert')
const _ = require('lodash')

const validationFactory = require('./validation.js')
const actions = require('./actions')

const modelPaths = ['query', 'body', 'params']
const actionKeys = ['handler', 'options', 'queryModel', 'paramsModel', 'bodyModel']

function extendMiddleware(base, addition) {
  if (_.isArray(addition)) {
    Array.prototype.push.apply(base, addition)
  } else if (addition) {
    base.push(addition)
  }
}

function isAction(object) {
  return typeof object === 'object' &&
    typeof object.handler === 'function' &&
    _.difference(_.keys(object), actionKeys).length === 0
}

module.exports = function (extOptions) {
  const validation = validationFactory(extOptions).bake

  return {
    name: 'express-route',
    determineDependencies(modelDef) {
      return [modelDef.name + ':' + _.get(extOptions, 'database', 'sql')]
    },
    bake(modelDef, options, deps) {
      options = options || {}

      const action = options.action
      let actionLogic = actions[action]
      if (isAction(options)) {
        actionLogic = options
        options = _.cloneDeep(actionLogic.options)
      } else {
        assert.ok(isAction(actionLogic), `unknown action: ${action}`)
        options = _.assign(_.cloneDeep(actionLogic.options), options)
      }

      const middleware = []
      const output = {middleware}
      const validationMiddleware = modelPaths
        .map(determineMiddleware)
        .filter(Boolean)

      extendMiddleware(middleware, _.get(options, 'middleware.preValidation'))
      extendMiddleware(middleware, validationMiddleware)
      extendMiddleware(middleware, _.get(options, 'middleware.postValidation'))
      extendMiddleware(middleware, actionLogic.handler(modelDef, options, extOptions, deps))
      extendMiddleware(middleware, _.get(options, 'middleware.postResponse'))

      return output

      function determineMiddleware(path) {
        const modelFactory = _.get(actionLogic, path + 'Model', _.noop)
        const model = modelFactory(modelDef, options, deps)

        if (model) {
          const baseOpts = _.get(options, ['validation', path])
          const validationOpts = _.assign({in: path}, baseOpts)
          output[`${path}Model`] = model
          return validation(_.defaults({model}, modelDef), validationOpts, deps)
        }
      }
    },
  }
}

/*
kiln.bake('user', 'express-crud-route', {
  action: 'list',
  equality: ['id', 'email'],
  range: ['updatedAt'],
  middleware: {preValidation, postValidation, },
  validation: {},
});
*/
