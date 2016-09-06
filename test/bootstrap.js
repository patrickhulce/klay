var path = require('path');
var assert = require('assert');
var chai = require('chai');
var sinon = require('sinon');
chai.should();

chai.use(require('sinon-chai'));

global.sandbox = () => sinon.sandbox.create();
global.relativeRequire = file => require('../lib/' + file);
global.defineTest = (file, func) => {
  describe(file, function () {
    func(require('../lib/' + file));
  });
};


var mapIntoFunctions = function (values, validate, model) {
  return values.map(value => [() => {
    validate.call(model, value);
  }, value]);
};

global.testPassingValues = function () {
  mapIntoFunctions.apply(null, arguments).forEach(items => {
    try {
      items[0].should.not.throw();
    } catch (err) {
      assert.ok(false, `${items[1]} failed validation: ${err.message}`);
    }
  });
};

global.testFailingValues = function () {
  mapIntoFunctions.apply(null, arguments).forEach(items => {
    try {
      items[0].should.throw(assert.AssertionError);
    } catch (err) {
      assert.fail(`${items[1]} should have failed validation`);
    }
  });
};
