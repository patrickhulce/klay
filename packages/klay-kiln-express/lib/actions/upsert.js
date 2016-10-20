var creatifyModel = require('../shared/creatifyModel');
var findDbModel = require('../shared/findDbModel');

module.exports = {
  options: {},
  bodyModel: function (modelDef, options) {
    return creatifyModel(modelDef.model, options);
  },
  handler: function (modelDef, options, extOptions, dependencies) {
    var dbModel = findDbModel(modelDef.name, options, dependencies);
    return function (req, res, next) {
      var payload = req.validated.body;
      res.promise = dbModel.upsert(payload);
      next();
    };
  },
};
