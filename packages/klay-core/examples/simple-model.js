const klay = require('../lib').defaultModelContext

const myModel = klay
  .object()
  .children({
    firstName: klay.string().required(),
    lastName: klay.string().required(),
    email: klay.email().required(),
    age: klay.integer(),
  })
  .strict()

const results = myModel.validate({
  firstName: 'John',
  lastName: 42,
  email: 'invalid.com',
  age: 'eleven',
})

console.log(results.toJSON())
