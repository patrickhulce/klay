const sinon = require('sinon')
const Kiln = require('klay-kiln').Kiln
const ModelContext = require('klay').ModelContext
const {DatabaseExtension, DatabaseExecutor} = require('klay-db')
const RouteExtension = require('../dist/extensions/route').RouteExtension
const RouterExtension = require('../dist/extensions/router').RouterExtension

function createModel(context) {
  const tracking = {
    trackingId: context
      .uuid()
      .automanage({supplyWith: 'uuid', event: 'create'})
      .constrain({type: 'immutable'}),
    lastVisit: context.date().optional(),
  }

  const user = {
    id: context.uuidID(),
    age: context.integer(),
    isAdmin: context.boolean(),
    email: context
      .email()
      .max(250)
      .constrain({type: 'unique'}),
    password: context.string().max(32),
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
  const next = sinon.stub()
  let nextCalledAll = true
  for (const fn of middleware) {
    const startCallCount = next.callCount
    await fn(req, res, next)

    if (next.callCount === startCallCount || next.getCall(startCallCount).args[0]) {
      nextCalledAll = false
      break
    }
  }

  return {req, res, next, nextCalledAll}
}

module.exports = {
  state,
  runMiddleware,
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
