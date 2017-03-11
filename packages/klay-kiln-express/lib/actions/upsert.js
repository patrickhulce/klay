const creatifyModel = require('../shared/creatifyModel')
const findDbModel = require('../shared/findDbModel')

module.exports = {
  options: {},
  bodyModel(modelDef, options) {
    return creatifyModel(modelDef.model, options)
  },
  handler(modelDef, options, extOptions, dependencies) {
    const dbModel = findDbModel(modelDef.name, options, dependencies)
    return function (req, res, next) {
      const payload = req.validated.body
      res.promise = dbModel.upsert(payload)
      next()
    }
  },
}
