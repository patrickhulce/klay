const Model = relativeRequire('Model.js')

defineTest('extensions/builders.js', buildersFactory => {
  let builders

  beforeEach(() => {
    builders = buildersFactory(spec => new Model(spec)).builders
  })

  const types = ['undefined', 'any', 'string', 'number', 'boolean', 'object', 'array']
  types.forEach(type => {
    describe('#' + type, () => {
      it('should create a model with the specified type', () => {
        const model = builders[type]()
        model.should.be.instanceof(Model)
        model.spec.should.have.property('type', type)
      })

      if (type === 'object' || type === 'array') {
        it('should set spec.children', () => {
          const modelSpec = type === 'object' ?
            {id: builders.string()} :
            {type: 'string'}

          const model = builders[type](modelSpec)
          model.should.be.instanceof(Model)
          model.spec.should.have.property('type', type)
          if (type === 'array') {
            model.spec.should.have.property('children').an('object')
          } else {
            model.spec.should.have.property('children')
              .with.nested.property('0.model').instanceof(Model)
          }
        })
      }
    })
  })

  describe('#enum', () => {
    it('should create a model with options from arguments', () => {
      const model = builders.enum(1, 2, 3)
      model.should.be.instanceof(Model)
      model.spec.should.have.property('options').eql([1, 2, 3])
    })

    it('should create a model with options from array', () => {
      const model = builders.enum(['first', 'second', 'third'])
      model.should.be.instanceof(Model)
      model.spec.should.have.property('options').eql(['first', 'second', 'third'])
    })

    it('should fail when no arguments are given', () => {
      (() => builders.enum()).should.throw()
    })

    it('should fail when an empty array is given', () => {
      (() => builders.enum([])).should.throw()
    })
  })
})
