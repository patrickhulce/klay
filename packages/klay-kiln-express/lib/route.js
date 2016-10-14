const assert = require('assert');
const _ = require('lodash');

const validationFactory = require('./validation.js');
const routes = require('./routes');

const modelPaths = ['query', 'body', 'params'];

function extendMiddleware(base, addition) {
  if (_.isArray(addition)) {
    Array.prototype.push.apply(base, addition);
  } else if (addition) {
    base.push(addition);
  }
}

module.exports = function (extOptions) {
  var validation = validationFactory(extOptions).bake;

  return {
    name: 'express-route',
    determineDependencies: function (modelDef) {
      return [modelDef.name + ':' + _.get(extOptions, 'database', 'sql')];
    },
    bake: function (modelDef, options, deps) {
      options = options || {};

      var route = options.action;
      var routeLogic = routes[route];
      assert.ok(routes[route], `unknown action: ${route}`);
      options = _.assign({}, routeLogic.defaultOptions, options);

      var middleware = [];
      var output = {middleware};
      var validationMiddleware = modelPaths.
        map(determineMiddleware).
        filter(Boolean);

      extendMiddleware(middleware, _.get(options, 'middleware.preValidation'));
      extendMiddleware(middleware, validationMiddleware);
      extendMiddleware(middleware, _.get(options, 'middleware.postValidation'));
      extendMiddleware(middleware, routeLogic.handler(modelDef, options, extOptions, deps));
      extendMiddleware(middleware, _.get(options, 'middleware.postResponse'));

      return output;

      function determineMiddleware(path) {
        var modelFactory = _.get(routeLogic, path + 'Model', _.noop);
        var model = modelFactory(modelDef, options, deps);

        if (model) {
          var baseOpts = _.get(options, ['validation', path]);
          var validationOpts = _.assign({in: path}, baseOpts);
          output[`${path}Model`] = model;
          return validation(_.defaults({model}, modelDef), validationOpts, deps);
        }
      }
    },
  };
};

/*
kiln.bake('user', 'express-crud-route', {
  action: 'list',
  equality: ['id', 'email'],
  range: ['updatedAt'],
  middleware: {preValidation, postValidation, },
  validation: {},
});
*/
