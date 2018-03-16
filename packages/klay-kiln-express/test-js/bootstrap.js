const chai = require('chai')
const sinon = require('sinon')
chai.should()

chai.use(require('sinon-chai'))

global.createSandbox = () => sinon.sandbox.create()
global.relativeRequire = file => require('../lib/' + file)
global.defineTest = (file, func) => {
  describe(file, () => {
    func(require('../lib/' + file))
  })
}

const klay = require('klay-core')
klay.use(require('klay-db')())

global.fixtures = {
  data: require('./fixtures/data'),
  models: require('./fixtures/models'),
}

if (process.env.KLAY_MYSQL_DB) {
  global.mysqlOptions = {
    host: process.env.KLAY_MYSQL_HOST,
    database: process.env.KLAY_MYSQL_DB,
    user: process.env.KLAY_MYSQL_USER,
    password: process.env.KLAY_MYSQL_PASSWORD || '',
  }

  global.describedb = function () {
    describe.apply(null, arguments)
  }
} else {
  global.describedb = function () {
    describe.skip.apply(null, arguments)
  }
}
