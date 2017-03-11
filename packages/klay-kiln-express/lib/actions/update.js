const _ = require('lodash')
const paramifyModel = require('../shared/paramifyModel')
const findDbModel = require('../shared/findDbModel')

module.exports = {
  options: {byId: true},
  paramsModel(modelDef, options) {
    return options.byId ? paramifyModel(modelDef.model, modelDef.name) : null
  },
  bodyModel(modelDef) {
    return modelDef.model
  },
  handler(modelDef, options, extOptions, dependencies) {
    const dbModel = findDbModel(modelDef.name, options, dependencies)
    return function (req, res, next) {
      const payload = options.byId ?
        _.assign({}, req.validated.body, req.validated.params) :
        req.validated.body

      res.promise = dbModel.update(payload)
      next()
    }
  },
}
