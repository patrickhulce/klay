var _ = require('lodash');
var Sequelize = require('sequelize');

var cached = [];

function get(options) {
  return _.find(cached, item => _.isEqual(item.options, options));
}

module.exports = function (dbOptions) {
  var existing = get(dbOptions);

  if (dbOptions.constructor === Sequelize) {
    return dbOptions;
  } else if (existing) {
    return existing.sequelize;
  } else {
    var database = dbOptions.database;
    var user = dbOptions.user || 'root';
    var password = dbOptions.password || null;
    var options = _.omit(dbOptions, ['database', 'user', 'password']);
    var sequelize = new Sequelize(database, user, password, options);
    cached.push({options: dbOptions, sequelize});
    return sequelize;
  }
};
