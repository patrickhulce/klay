var http = require('http');

var _ = require('lodash');
var klay = require('klay');
var Kiln = require('klay-kiln');
var kilnSql = require('klay-kiln-sql');
var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');

var kilnRouter = relativeRequire('router.js');

var kilnInst;
var kilnSqlInst;
var logging = _.noop;

var steps = module.exports = {
  init: function (configureApp) {
    kilnSqlInst = kilnSqlInst || kilnSql(_.assign({logging}, mysqlOptions));
    kilnInst = kilnInst || Kiln().
      add('user', fixtures.models.user).
      extend(kilnSqlInst).
      extend(kilnRouter());

    var shared = {kiln: kilnInst, sql: kilnSqlInst};

    before(function (done) {
      var app = express();
      app.use(bodyParser.json());
      (configureApp || _.noop)(kilnInst, app);

      app.use(function (req, res, next) {
        if (res.promise) {
          res.promise.then(r => res.json(r)).catch(next);
        } else {
          next();
        }
      });

      app.use(function (err, req, res, next) {
        if (err) {
          res.status(500);
          res.json({message: err.message});
          logging(err.stack);
        } else {
          next();
        }
      });

      shared.app = app;
      shared.server = app.listen(done);
    });

    after(function (done) {
      shared.server.close(done);
    });

    steps.cleanAndSync(shared);

    return shared;
  },
  cleanAndSync: function (shared) {
    it('should initialize database', function () {
      shared.dbModels = {user: shared.kiln.bake('user', 'sql')};
      return shared.sql.sync({force: true}).then(function () {
        return shared.dbModels.user.destroy({});
      });
    });
  },
  insertData: function (shared) {
    it('should create data', function () {
      return Promise.mapSeries(fixtures.data.users, u => shared.dbModels.user.create(u));
    });
  },
};
