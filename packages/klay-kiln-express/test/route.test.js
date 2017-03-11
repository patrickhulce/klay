const _ = require('lodash')

defineTest('route.js', routeFactory => {
  let route, sandbox

  beforeEach(() => {
    route = routeFactory()
    sandbox = createSandbox()
  })

  describe('#determineDependencies', () => {
    it('should get the sql model by default', () => {
      const deps = route.determineDependencies({name: 'user'})
      deps.should.eql(['user:sql'])
    })

    it('should get the model specified', () => {
      route = routeFactory({database: 'mongo'})
      const deps = route.determineDependencies({name: 'photo'})
      deps.should.eql(['photo:mongo'])
    })
  })

  describe('#bake', () => {
    let modelDef, dependencies

    beforeEach(() => {
      modelDef = {name: 'user', model: fixtures.models.user}
      dependencies = {'user:sql': {}}
    })

    context('when action is given', () => {
      let handler
      beforeEach(() => {
        handler = sandbox.stub()
      })

      it('should use the handler', () => {
        const middleware = sandbox.stub()
        handler.returns(middleware)
        const action = {handler}

        const output = route.bake(modelDef, action, dependencies)
        output.should.have.property('middleware').eql([middleware])
      })

      function shouldUseAModel(name) {
        it(`should use the ${name}`, () => {
          const middleware = sandbox.stub()
          handler.returns(middleware)

          const model = fixtures.models.user
          const modelFunc = sandbox.stub()
          modelFunc.returns(model)
          const action = _.set({handler}, name, modelFunc)

          const output = route.bake(modelDef, action, dependencies)
          output.should.have.property(name, model)
          output.should.have.property('middleware').length(2)
        })
      }

      shouldUseAModel('queryModel')
      shouldUseAModel('paramsModel')
      shouldUseAModel('bodyModel')

      it('should use options', () => {
        const middleware = sandbox.stub()
        handler.returns(middleware)
        const options = {my: 'value'}
        const action = {handler, options}

        route.bake(modelDef, action, dependencies)
        handler.should.have.been.called
        handler.firstCall.args[1].should.eql(options)
        handler.firstCall.args[1].should.not.equal(options)
      })
    })

    context('when action is referenced', () => {
      it('should find the action and validation middleware', () => {
        const options = {action: 'update'}
        const output = route.bake(modelDef, options, dependencies)
        output.should.have.property('middleware').length(3)
        output.should.have.property('paramsModel')
        output.should.have.property('bodyModel')
      })

      it('should merge options')

      it('should reject unrecognized actions', () => {
        const bake = () => route.bake(modelDef, {action: 'made-up'}, dependencies)
        bake.should.throw(/unknown action/)
      })
    })

    it('should use preValidation middleware', () => {
      const middlewareFunc = sandbox.stub()
      const middleware = {preValidation: middlewareFunc}
      const options = {action: 'create', middleware}
      const output = route.bake(modelDef, options, dependencies)
      output.should.have.property('middleware').length(3)
      output.should.have.deep.property('middleware.0', middlewareFunc)
    })

    it('should use postValidation middleware', () => {
      const middlewareFuncA = sandbox.stub()
      const middlewareFuncB = sandbox.stub()
      const middleware = {postValidation: [middlewareFuncA, middlewareFuncB]}
      const options = {action: 'create', middleware}
      const output = route.bake(modelDef, options, dependencies)
      output.should.have.property('middleware').length(4)
      output.should.have.deep.property('middleware.1', middlewareFuncA)
      output.should.have.deep.property('middleware.2', middlewareFuncB)
    })

    it('should use postResponse middleware', () => {
      const middlewareFunc = sandbox.stub()
      const middleware = {postResponse: middlewareFunc}
      const options = {action: 'create', middleware}
      const output = route.bake(modelDef, options, dependencies)
      output.should.have.property('middleware').length(3)
      output.should.have.deep.property('middleware.2', middlewareFunc)
    })
  })
})
