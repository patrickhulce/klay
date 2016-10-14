var _ = require('lodash');
var express = require('express');
var routeFactory = require('./route.js');

module.exports = function (extOptions) {
  var bakeRoute = routeFactory(extOptions).bake;

  return {
    name: 'express-router',
    determineDependencies: function (modelDef) {
      return [modelDef.name + ':' + _.get(extOptions, 'database', 'sql')];
    },
    bake: function (modelDef, options, deps) {
      var router = express.Router(); // eslint-disable-line

      var routes = _.map(options.routes, function (value, key) {
        var path = key.split(' ')[1];
        var method = key.split(' ')[0].toLowerCase();
        var options = typeof value === 'string' ? {action: value} : value;
        var extension = bakeRoute(modelDef, options, deps);
        return _.assign({path, method, options}, extension);
      });

      (options.middleware || []).forEach(function (middleware) {
        router.use(middleware);
      });

      routes.forEach(function (route) {
        router[route.method](route.path, route.middleware);
      });

      return {routes, router};
    },
  };
};

/*
kiln.bake('user', 'express-crud-router', {
  middleware: ,
  routes: {
    'GET /': {
      action: 'list',
      actionOptions: {equality: ['id', 'email'], range: ['updatedAt']}
    },
    'POST /': 'upsert',
    'DELETE /': 'destroy',
    'GET /:id': 'findById',
    'PUT /:id': 'updateById',
    'DELETE /:id': 'destroyById',
  }
});
*/
