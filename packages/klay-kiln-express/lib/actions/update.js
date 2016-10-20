var _ = require('lodash');
var paramifyModel = require('../shared/paramifyModel');
var findDbModel = require('../shared/findDbModel');

module.exports = {
  options: {byId: true},
  paramsModel: function (modelDef, options) {
    return options.byId ? paramifyModel(modelDef.model, modelDef.name) : null;
  },
  bodyModel: function (modelDef) {
    return modelDef.model;
  },
  handler: function (modelDef, options, extOptions, dependencies) {
    var dbModel = findDbModel(modelDef.name, options, dependencies);
    return function (req, res, next) {
      var payload = options.byId ?
        _.assign({}, req.validated.body, req.validated.params) :
        req.validated.body;

      res.promise = dbModel.update(payload);
      next();
    };
  },
};
