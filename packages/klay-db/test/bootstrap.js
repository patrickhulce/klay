const chai = require('chai')
const sinon = require('sinon')

chai.should()
chai.use(require('sinon-chai'))

global.sandbox = () => sinon.sandbox.create()
global.relativeRequire = file => require('../lib/' + file)
global.defineTest = (file, func) => {
  describe(file, () => {
    func(require('../lib/' + file))
  })
}
