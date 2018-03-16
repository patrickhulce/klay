const klay = require('../lib').defaultModelContext

klay.use({
  types: ['custom-type'],
  defaults: {required: true, strict: true}
})

const myModel = klay
  .object()
  .children({
    firstName: klay.string(),
    lastName: klay.string(),
    email: klay.email(),
    age: klay.integer().optional(),
    custom: klay.customType(),
  })
  .strict()

  const results = myModel.validate({
    firstName: 'John',
    lastName: 42,
    email: 'invalid.com',
    age: 'eleven',
  })

  console.log(results.toJSON())
