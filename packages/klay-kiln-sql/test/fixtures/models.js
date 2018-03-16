const ModelContext = require('klay-core').ModelContext
const DatabaseExtension = require('klay-db').DatabaseExtension

module.exports = {
  create() {
    const modelContext = new ModelContext()
    modelContext.use(new DatabaseExtension())
    modelContext.use({defaults: {strict: true}})

    const user = {
      id: modelContext.integerID(),
      age: modelContext.integer().required(),
      isAdmin: modelContext.boolean().required(),
      email: modelContext
        .email()
        .required()
        .max(250)
        .constrain({type: 'unique'}),
      password: modelContext
        .string()
        .required()
        .max(32),
      firstName: modelContext
        .string()
        .required()
        .max(100),
      lastName: modelContext
        .string()
        .required()
        .max(100),
      createdAt: modelContext.createdAt(),
      updatedAt: modelContext.updatedAt(),
    }

    const photo = {
      id: modelContext.uuidID(),
      ownerId: modelContext
        .integer()
        .required()
        .constrain({type: 'reference', meta: {referencedModel: 'user'}}),
      aspectRatio: modelContext.number().required(),
      metadata: modelContext
        .object()
        .strict(false)
        .required(),
      createdAt: modelContext.createdAt(),
      updatedAt: modelContext.updatedAt(),
    }

    return {
      user: modelContext
        .object()
        .children(user)
        .constrain({type: 'unique', properties: [['firstName'], ['lastName']]})
        .index([['email'], ['password']]),
      photo: modelContext.object().children(photo),
    }
  },
}
