const _ = require('lodash')
const express = require('express')
const routeFactory = require('./route.js')

module.exports = function (extOptions) {
  const bakeRoute = routeFactory(extOptions).bake

  return {
    name: 'express-router',
    determineDependencies(modelDef) {
      return [modelDef.name + ':' + _.get(extOptions, 'database', 'sql')]
    },
    bake(modelDef, options, deps) {
      // eslint-disable-next-line new-cap
      const router = express.Router()

      const routes = _.map(options.routes, (value, key) => {
        const path = key.split(' ')[1]
        const method = key.split(' ')[0].toLowerCase()
        const options = typeof value === 'string' ? {action: value} : value
        const extension = bakeRoute(modelDef, options, deps)
        return _.assign({path, method, options}, extension)
      })

      const middleware = options.middleware || []
      middleware.forEach(middleware => {
        router.use(middleware)
      })

      routes.forEach(route => {
        router[route.method](route.path, route.middleware)
      })

      return {routes, router}
    },
  }
}

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
