var klay = require('klay');
var klayDb = require('klay-db');

module.exports = function () {
  klay.reset();
  klay().
    use(klayDb()).
    use({defaults: {nullable: false}});

  var types = klay.builders;

  var user = {
    id: types.integerId(),
    age: types.integer().required(),
    isAdmin: types.boolean().required(),
    email: types.email().required().max(250).unique(),
    password: types.string().required().max(32),
    firstName: types.string().required().max(100),
    lastName: types.string().required().max(100),
    createdAt: types.createdAt(),
    updatedAt: types.updatedAt(),
  };

  var photo = {
    id: types.uuidId(),
    ownerId: types.integer().required().dbconstrain('reference', {model: 'user'}),
    aspectRatio: types.number().required(),
    metadata: types.object().required(),
    createdAt: types.createdAt(),
    updatedAt: types.updatedAt(),
  };

  return {
    user: types.object(user).dbindexChildren(['email', 'password']),
    photo: types.object(photo),
  };
};
