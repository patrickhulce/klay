var chai = require('chai');
var sinon = require('sinon');
chai.should();

chai.use(require('sinon-chai'));

global.createSandbox = () => sinon.sandbox.create();
global.relativeRequire = file => require('../lib/' + file);
global.defineTest = (file, func) => {
  describe(file, function () {
    func(require('../lib/' + file));
  });
};

if (process.env.KLAY_MYSQL_DB) {
  global.mysqlOptions = {
    host: process.env.KLAY_MYSQL_HOST,
    database: process.env.KLAY_MYSQL_DB,
    user: process.env.KLAY_MYSQL_USER,
    password: process.env.KLAY_MYSQL_PASSWORD || '',
  };

  global.describesql = function () {
    describe.apply(null, arguments);
  };
} else {
  global.describesql = function () {
    describe.skip.apply(null, arguments);
  };
}
