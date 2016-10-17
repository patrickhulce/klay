var assert = require('assert');

var _ = require('lodash');
var paramifyModel = require('../shared/paramifyModel');
var findDbModel = require('../shared/findDbModel');

module.exports = {
  defaultOptions: {byId: true},
  paramsModel: function (modelDef) {
    return paramifyModel(modelDef.model, modelDef.name);
  },
  handler: function (modelDef, options, extOptions, dependencies) {
    var dbModel = findDbModel(modelDef.name, options, dependencies);
    return function (req, res, next) {
      var where = req.validated.params;
      res.promise = dbModel.findOne({where}).then(function (item) {
        assert.ok(item, 'no such record: ' + _.values(where)[0]);
        return item;
      });
      next();
    };
  },
};
