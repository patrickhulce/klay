const Model = relativeRequire('Model.js')
const klay = relativeRequire('klay.js')

defineTest('extensions/minmax.js', minmaxFactory => {
  const extension = minmaxFactory(spec => new Model(spec))

  describe('#validations', () => {
    describe('integer', () => {
      const validate = extension.validations.number.integer
      it('should pass valid integer values', () => {
        (function () {
          validate(0)
          validate(145)
          validate(-123124.0)
        }).should.not.throw()
      })

      it('should fail invalid values', () => {
        [
          () => validate(0.5),
          () => validate(123.1231),
          () => validate(-1231 / 1121),
        ].forEach(f => f.should.throw())
      })
    })

    describe('number', () => {
      let validate

      beforeEach(() => {
        validate = extension.validations.number.__default[0]
      })

      it('should respect minimum value', () => {
        validate = validate.bind({spec: {min: 10}});
        (() => validate(-11)).should.throw();
        (() => validate(9)).should.throw();
        (() => validate(10)).should.not.throw();
        (() => validate(100)).should.not.throw()
      })

      it('should respect maximum value', () => {
        validate = validate.bind({spec: {max: 10}});
        (() => validate(-11)).should.not.throw();
        (() => validate(9)).should.not.throw();
        (() => validate(10)).should.not.throw();
        (() => validate(100)).should.throw()
      })
    })

    describe('string', () => {
      let validate

      beforeEach(() => {
        validate = extension.validations.string.__default[0]
      })

      it('should respect minimum value', () => {
        validate = validate.bind({spec: {min: 10}});
        (() => validate('short')).should.throw();
        (() => validate('alsoshort')).should.throw();
        (() => validate('just right')).should.not.throw();
        (() => validate('super super long')).should.not.throw()
      })

      it('should respect maximum value', () => {
        validate = validate.bind({spec: {max: 10}});
        (() => validate('short')).should.not.throw();
        (() => validate('alsoshort')).should.not.throw();
        (() => validate('just right')).should.not.throw();
        (() => validate('super super long')).should.throw()
      })
    })

    describe('array', () => {
      let validate

      beforeEach(() => {
        validate = extension.validations.array.__default[0]
      })

      it('should respect minimum value', () => {
        validate = validate.bind({spec: {min: 3}});
        (() => validate([])).should.throw();
        (() => validate([1, 2])).should.throw();
        (() => validate([1, 2, 3])).should.not.throw();
        (() => validate([1, 2, 3, 4, 5, 6, 7])).should.not.throw()
      })

      it('should respect maximum value', () => {
        validate = validate.bind({spec: {max: 3}});
        (() => validate([])).should.not.throw();
        (() => validate([1, 2])).should.not.throw();
        (() => validate([1, 2, 3])).should.not.throw();
        (() => validate([1, 2, 3, 4, 5, 6, 7])).should.throw()
      })
    })

    describe('object', () => {
      let validate

      beforeEach(() => {
        validate = extension.validations.object.__default[0]
      })

      it('should respect minimum value', () => {
        validate = validate.bind({spec: {min: 2}});
        (() => validate({})).should.throw();
        (() => validate({a: 1})).should.throw();
        (() => validate({a: 1, b: 2})).should.not.throw();
        (() => validate({a: 1, b: 2, c: 3, d: 4})).should.not.throw()
      })

      it('should respect maximum value', () => {
        validate = validate.bind({spec: {max: 2}});
        (() => validate({})).should.not.throw();
        (() => validate({a: 1})).should.not.throw();
        (() => validate({a: 1, b: 2})).should.not.throw();
        (() => validate({a: 1, b: 2, c: 3, d: 4})).should.throw()
      })
    })
  })

  describe('#extend', () => {
    beforeEach(() => {
      klay({extensions: []}).use(extension)
    })

    afterEach(() => {
      klay.reset()
    })

    describe('min', () => {
      it('should set spec.min', () => {
        const model = klay.builders.integer().min(10)
        model.should.have.deep.property('spec.min', 10)
        model.validate(8).should.have.property('conforms', false)
        model.validate(11).should.have.property('conforms', true)
      })

      it('should fail for non-numeric types', () => {
        (function () {
          klay.builders.number().min('foo')
        }).should.throw()
      })
    })

    describe('max', () => {
      it('should set spec.max', () => {
        const model = klay.builders.integer().max(10)
        model.should.have.deep.property('spec.max', 10)
        model.validate(8).should.have.property('conforms', true)
        model.validate(11).should.have.property('conforms', false)
      })

      it('should fail for non-numeric types', () => {
        (function () {
          klay.builders.number().max('foo')
        }).should.throw()
      })
    })

    describe('length', () => {
      it('should set spec.min and spec.max', () => {
        const model = (new klay.Model({type: 'string'})).length(10)
        model.should.have.deep.property('spec.min', 10)
        model.should.have.deep.property('spec.max', 10)
        model.validate('0123456789').should.have.property('conforms', true)
      })

      it('should fail for non-numeric types', () => {
        (function () {
          new Model({type: 'array'}).length('foo')
        }).should.throw()
      })
    })
  })
})
