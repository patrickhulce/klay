const Kiln = require('klay-kiln').Kiln
const ModelContext = require('klay-core').ModelContext
const {DatabaseExtension, DatabaseExecutor} = require('klay-db')
const createRouteOrActionRoute = require('../lib/helpers/create-router').createRouteOrActionRoute
const Grants = require('../lib/auth/grants').Grants

function createModel(context) {
  const tracking = {
    trackingId: context
      .uuid()
      .automanage({supplyWith: 'uuid', event: 'create'})
      .constrain({type: 'immutable'}),
    lastVisit: context.dateTime().optional(),
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
  const kilnModel = kiln.getModels()[0]
  return {kiln, model, kilnModel, extension, executor}
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

function createRoute(options, state) {
  return createRouteOrActionRoute(options, {defaults: {}}, state.kilnModel, state.executor)
}

module.exports = {
  state,
  runMiddleware,
  createRoute,
  Grants,
  auth: {
    roles: {
      user: [
        // Grant admin permission to people with same lastName
        {permission: 'users:admin', criteria: {lastName: '<%= lastName %>'}},
        // Grant write permission to posts owned by the user
        {permission: 'posts:write', criteria: {userId: '<%= id %>'}},
      ],
    },
    permissions: {
      'users:admin': [],
      'posts:write': ['posts:read'],
      'posts:read': [],
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
