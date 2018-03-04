const _ = require('lodash')
const Kiln = require('klay-kiln')
const kilnSql = require('klay-kiln-sql')
const express = require('express')
const bodyParser = require('body-parser')

const kilnRouter = relativeRequire('router.js')

let kilnInst, kilnSqlInst
const logging = _.noop

const steps = module.exports = {
  init(configureApp) {
    if (typeof mysqlOptions === 'undefined') {
      return
    }

    kilnSqlInst = kilnSqlInst || kilnSql(_.assign({logging}, mysqlOptions))
    kilnInst = kilnInst || Kiln()
      .add('user', fixtures.models.user)
      .extend(kilnSqlInst)
      .extend(kilnRouter())

    const shared = {kiln: kilnInst, sql: kilnSqlInst}

    before(done => {
      const app = express()
      app.use(bodyParser.json());
      (configureApp || _.noop)(kilnInst, app)

      app.use((req, res, next) => {
        if (res.promise) {
          res.promise.then(r => res.json(r)).catch(next)
        } else {
          next()
        }
      })

      app.use((err, req, res, next) => {
        if (err) {
          res.status(500)
          res.json({message: err.message})
          logging(err.stack)
        } else {
          next()
        }
      })

      shared.app = app
      shared.server = app.listen(done)
    })

    after(done => {
      shared.server.close(done)
    })

    steps.cleanAndSync(shared)

    return shared
  },
  cleanAndSync(shared) {
    it('should initialize database', () => {
      shared.dbModels = {user: shared.kiln.bake('user', 'sql')}
      return shared.sql.sync({force: true}).then(() => {
        return shared.dbModels.user.destroy({})
      })
    })
  },
  insertData(shared) {
    it('should create data', () => {
      return shared.dbModels.user.create(fixtures.data.users)
    })
  },
}
