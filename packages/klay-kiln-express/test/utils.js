const Kiln = require('klay-kiln').Kiln
const ModelContext = require('klay-core').ModelContext
const {DatabaseExtension, DatabaseExecutor} = require('klay-db')
const RouteExtension = require('../lib/extensions/action-route').ActionRouteExtension
const RouterExtension = require('../lib/extensions/router').RouterExtension
const Grants = require('../lib/auth/grants').Grants

function createModel(context) {
  const tracking = {
    trackingId: context
      .uuid()
      .automanage({supplyWith: 'uuid', event: 'create'})
      .constrain({type: 'immutable'}),
    lastVisit: context.date().optional(),
  }

  const user = {
    id: context.uuidId(),
    age: context.integer(),
    isAdmin: context.boolean(),
    email: context
      .email()
      .max(250)
      .constrain({type: 'unique'}),
    password: context
      .string()
      .max(32)
      .coerce(vr => vr.setValue(`hashed:${vr.value}`)),
    firstName: context.string().max(100),
    lastName: context.string().max(100),
    metadata: context
      .object()
      .optional()
      .default(null)
      .nullable(),
    tracking: context
      .object()
      .children(tracking)
      .strict(),
    createdAt: context.createdAt(),
    updatedAt: context.updatedAt(),
  }

  return context.object().children(user)
}

function state() {
  const kiln = new Kiln()
  const context = new ModelContext()
  context.use({defaults: {strict: true, required: true}})
  context.use(new DatabaseExtension())

  const model = createModel(context)
  const executor = new DatabaseExecutor(model, {})
  const extension = {
    name: 'db',
    defaultOptions: {},
    build() {
      return executor
    },
  }

  kiln.addModel({name: 'user', model})
  kiln.addExtension({extension})
  kiln.addExtension({extension: new RouteExtension({databaseExtension: 'db'})})
  kiln.addExtension({extension: new RouterExtension()})
  return {kiln, model, extension, executor}
}

async function runMiddleware(middleware, req) {
  req = req || {}
  const res = {}
  const next = jest.fn()
  let nextCalledAll = true
  let err = undefined
  for (const fn of middleware) {
    const startCallCount = next.mock.calls.length
    await fn(req, res, next)

    if (next.mock.calls.length === startCallCount || next.mock.calls[startCallCount][0]) {
      nextCalledAll = false
      err = next.mock.calls[startCallCount][0]
      break
    }
  }

  return {req, res, next, nextCalledAll, err}
}

module.exports = {
  state,
  runMiddleware,
  Grants,
  auth: {
    roles: {
      user: [
        {permission: 'users:admin', criteria: 'lastName=<%= lastName %>'},
        {permission: 'write', criteria: 'userId=<%= id %>'},
      ],
    },
    permissions: {
      'users:admin': [],
      write: ['read'],
      read: [],
    },
  },
  defaultUser: {
    age: 24,
    isAdmin: true,
    email: 'klay@example.com',
    password: 'rocko',
    firstName: 'Klay',
    lastName: 'Thompson',
    tracking: {},
  },
}
