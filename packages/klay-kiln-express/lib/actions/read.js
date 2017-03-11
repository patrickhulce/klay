const assert = require('assert')

const _ = require('lodash')
const paramifyModel = require('../shared/paramifyModel')
const findDbModel = require('../shared/findDbModel')

module.exports = {
  options: {byId: true},
  paramsModel(modelDef) {
    return paramifyModel(modelDef.model, modelDef.name)
  },
  handler(modelDef, options, extOptions, dependencies) {
    const dbModel = findDbModel(modelDef.name, options, dependencies)
    return function (req, res, next) {
      const where = req.validated.params
      res.promise = dbModel.findOne({where}).then(item => {
        assert.ok(item, 'no such record: ' + _.values(where)[0])
        return item
      })
      next()
    }
  },
}
