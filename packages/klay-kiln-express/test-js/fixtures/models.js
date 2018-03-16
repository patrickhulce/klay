var types = require('klay-core').builders;

var user = {
  id: types.integerId(),
  age: types.integer().required(),
  isAdmin: types.boolean().required(),
  email: types.email().required().max(250).unique(),
  password: types.string().required().max(32),
  firstName: types.string().required().max(100),
  lastName: types.string().required().max(100),
  metadata: types.object().default(null),
  createdAt: types.createdAt(),
  updatedAt: types.updatedAt(),
};

module.exports = {
  user: types.object(user).
    dbconstrainChildren(['firstName', 'lastName'], 'unique').
    dbindexChildren(['email', 'password']),
};
