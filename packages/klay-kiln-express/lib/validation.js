var _ = require('lodash');

function createMiddleware(model, modelAsList, options) {
  var path = _.get(options, 'in', 'body');
  var status = _.get(options, 'status', 400);
  var shouldRespond = _.get(options, 'respond', true);
  var toResponse = _.get(options, 'toResponse', _.identity);
  var allowedAsList = _.get(options, 'allowedAsList', false);

  return function (req, res, next) {
    var source = req[path];
    var validated = req.validated = req.validated || {};
    var modelToUse = allowedAsList && _.isArray(source) ? modelAsList : model;

    var results = modelToUse.validate(source);
    _.merge(validated, _.set({}, path, results.value));

    if (results.conforms) {
      next();
    } else if (shouldRespond) {
      res.status(status);
      res.json(toResponse(results));
    } else {
      var err = new Error('validation failure');
      err.isKilnExpressValidation = true;
      err.results = results;
      next(err);
    }
  };
}

module.exports = function (extOptions) {
  return {
    name: 'express-validation',
    bake: function (modelDef, options, dependencies) {
      options = options || {};

      var model = modelDef.model;
      if (options.transform) {
        model = options.transform(model);
      } else if (options.omit) {
        model = model.omit(options.omit);
      } else if (options.pick) {
        model = model.pick(options.pick);
      }

      var modelAsList = model.constructor.construct({type: 'array', children: model}).required();
      var middleware = createMiddleware(model, modelAsList, options);
      middleware.model = model;
      middleware.in = options.in || 'body';
      return middleware;
    },
  };
};
