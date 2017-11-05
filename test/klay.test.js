const Model = relativeRequire('Model.js')

defineTest('klay.js', klay => {
  afterEach(() => {
    klay.reset()
  })

  describe('#()', () => {
    it('should return the klay object', () => {
      const inst = klay()
      inst.should.equal(klay)
      inst.should.have.property('use').a('function')
      inst.should.have.property('reset').a('function')
      inst.should.have.property('builders').an('object')
      inst.should.have.property('Model').a('function')
    })

    it('should initialize extensions by default', () => {
      const inst = klay()
      inst.builders.should.have.property('string')
    })

    it('should respect options passed in', () => {
      const inst = klay({extensions: false})
      inst.builders.should.eql({})
    })

    it('should return existing klay object when options are same', () => {
      const instA = klay({foobar: 123})
      const instB = klay({foobar: 123})
      instA.should.equal(instB)
    })
  })

  describe('#use', () => {
    let inst

    beforeEach(() => {
      inst = klay({extensions: ['builders']})
    })

    it('should merge types', () => {
      inst.use({types: ['myFavoriteType']})
      Model.types.should.include('string')
      Model.types.should.include('myFavoriteType')
    })

    it('should merge formats', () => {
      inst.use({formats: {string: ['name', 'phone'], number: ['int']}})
      inst.use({formats: {string: ['address'], any: ['thing']}})
      Model.formats.should.have.property('any').eql(['thing'])
      Model.formats.should.have.property('number').eql(['int'])
      Model.formats.should.have.property('string').eql(['name', 'phone', 'address'])
    })

    it('should merge defaults', () => {
      inst.use({defaults: {strict: true, required: true}})
      Model.defaults.should.eql({strict: true, required: true, nullable: true})
      inst.use({defaults: {nullable: false}})
      Model.defaults.should.have.property('nullable', false)
    })

    it('should merge hooks', () => {
      const f1 = () => 123
      const f2 = () => 456
      inst.use({hooks: {constructor: f1, children: [f1, f2]}})
      Model.hooks.should.eql({constructor: [f1], children: [f1, f2]})
      inst.use({hooks: {constructor: f2}})
      Model.hooks.should.eql({constructor: [f1, f2], children: [f1, f2]})
    })

    it('should merge builders', () => {
      const myBuilder = () => 123
      inst.use({builders: {foobar: myBuilder}})
      inst.builders.should.have.property('string').a('function')
      inst.builders.should.have.property('foobar', myBuilder)
    })

    it('should create builders from formats', () => {
      inst.use({
        builders: true,
        formats: {
          string: ['myName', 'other'],
          number: ['float', 'double'],
        },
      })

      inst.builders.should.have.property('string').a('function')
      inst.builders.should.have.property('myName').a('function')
      inst.builders.should.have.property('other').a('function')
      inst.builders.should.have.property('float').a('function')
      inst.builders.should.have.property('double').a('function')

      const modelA = inst.builders.myName()
      modelA.should.be.instanceof(Model)
      modelA.should.have.deep.property('spec.type', 'string')
      modelA.should.have.deep.property('spec.format', 'myName')

      const modelB = inst.builders.double()
      modelB.should.be.instanceof(Model)
      modelB.should.have.deep.property('spec.type', 'number')
      modelB.should.have.deep.property('spec.format', 'double')
    })

    it('should respect builderExtras', () => {
      inst.use({
        builders: true,
        builderExtras: {
          myName: model => model.options(['foo', 'bar']),
        },
        formats: {
          string: ['myName'],
        },
      })

      const modelA = inst.builders.myName()
      modelA.should.be.instanceof(Model)
      modelA.should.have.deep.property('spec.type', 'string')
      modelA.should.have.deep.property('spec.format', 'myName')
      modelA.should.have.deep.property('spec.options').eql(['foo', 'bar'])
    })

    it('should merge transformations', () => {
      const nameTransform = value => value + 'NAME'
      const numberTransform = value => Number(value)
      inst.use({
        transformations: {
          string: {name: nameTransform},
          number: {__default: numberTransform},
        },
      })

      Model.transformations.should.have.deep.property('string.name', nameTransform)
      Model.transformations.should.have.deep.property('number.__default', numberTransform)
    })

    it('should merge validations', () => {
      const nameValidate = value => value + 'NAME'
      const numberValidate = value => Number(value)
      inst.use({
        validations: {
          string: {name: nameValidate},
          number: {__default: numberValidate},
        },
      })

      Model.validations.should.have.deep.property('string.name', nameValidate)
      Model.validations.should.have.deep.property('number.__default', numberValidate)
    })

    it('should merge and union validations', () => {
      const validationA = value => Number(value)
      const validationB = value => String(value)
      inst.use({validations: {number: {__default: [validationA]}}})
      inst.use({validations: {number: {__default: validationB}}})

      Model.validations.should.have.deep.property('number.__default')
        .include(validationA)
        .include(validationB)
    })

    it('should merge Model prototype', () => {
      const doIt = function (v) {
        this.foobar = v
        return this
      }

      inst.use({extend: {prop: 1, doIt}})
      inst.Model.prototype.should.have.property('prop', 1)
      const model = inst.builders.string().doIt(123)
      model.should.have.property('foobar', 123)
    })

    it('should merge Model prototype when extend is function', () => {
      const foobar = () => 'foobar'
      const extend = base => {
        base.hidden = true
        base.should.have.property('type').a('function')
        base.should.have.property('format').a('function')
        base.should.have.property('required').a('function')
        base.should.have.property('foobar', foobar)
        return {prop: 1}
      }

      inst.use({extend: {foobar}})
      inst.use({extend})
      inst.Model.prototype.should.not.have.property('hidden')
      inst.Model.prototype.should.have.property('prop', 1)
    })
  })
})
