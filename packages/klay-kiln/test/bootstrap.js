var chai = require('chai');
var sinon = require('sinon');
chai.should();

global.createSandbox = () => sinon.sandbox.create();
global.relativeRequire = file => require('../lib/' + file);
global.defineTest = (file, func) => {
  describe(file, function () {
    func(require('../lib/' + file));
  });
};
