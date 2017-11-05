const assert = require('assert')
const should = require('chai').should()

const Model = relativeRequire('Model')

defineTest('transformations.js', transformations => {
  describe('#boolean', () => {
    const transform = transformations.boolean.__default

    it('should transform string values', () => {
      transform('true').should.equal(true)
      transform('false').should.equal(false)
    })

    it('should directly return a boolean value', () => {
      transform(true).should.equal(true)
      transform(false).should.equal(false)
    })

    it('should directly return all other values', () => {
      const obj = {}
      const arr = []

      transform(0).should.equal(0)
      transform(obj).should.equal(obj)
      transform(arr).should.equal(arr)
      should.equal(transform(null), null)
      should.equal(transform(undefined), undefined)
    })
  })

  describe('#number', () => {
    const transform = transformations.number.__default

    it('should transform valid string values', () => {
      transform('123').should.equal(123)
      transform('12.54').should.equal(12.54)
    })

    it('should directly return an invalid string value', () => {
      transform('').should.equal('')
      transform('two').should.equal('two')
      transform('foobar').should.equal('foobar')
    })

    it('should directly return all other values', () => {
      const obj = {}
      const arr = []

      transform(obj).should.equal(obj)
      transform(arr).should.equal(arr)
      should.equal(transform(null), null)
      should.equal(transform(undefined), undefined)
    })
  })

  describe('#object', () => {
    const transform = transformations.object.__default

    it('should directly return values when children is not set', () => {
      const arr = []
      const obj = {property: 1}
      const model = new Model({type: 'object'})

      transform.call(model, 123).should.equal(123)
      transform.call(model, arr).should.equal(arr)
      transform.call(model, obj).should.equal(obj)
      transform.call(model, 'foobar').should.equal('foobar')
      should.equal(transform.call(model, undefined), undefined)
    })

    it('should fail when value is not an object', () => {
      (function () {
        const child = {foo: {}}
        const model = new Model({type: 'object', children: child})

        transform.call(model, 'foobar')
      }).should.throw(assert.AssertionError)
    })

    context('when validating children', () => {
      let children, model

      beforeEach(() => {
        children = {
          id: new Model({type: 'number'}),
          name: new Model({type: 'string', validations: [/^ABC/]}),
          isAdmin: new Model({type: 'boolean'}),
        }

        model = new Model({
          type: 'object',
          children,
        })
      })

      it('should succeed', () => {
        transform.call(model, {
          id: 123,
          name: 'ABC4ME',
          isAdmin: true,
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'ABC4ME',
            isAdmin: true,
          },
        })
      })

      it('should transform children', () => {
        transform.call(model, {
          id: '1234',
          name: 'ABC4ME',
          isAdmin: 'false',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 1234,
            name: 'ABC4ME',
            isAdmin: false,
          },
        })
      })

      it('should pass along unknown children', () => {
        transform.call(model, {
          id: '1234',
          name: 'ABC4ME',
          isAdmin: 'false',
          unknown: 'value',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 1234,
            name: 'ABC4ME',
            isAdmin: false,
            unknown: 'value',
          },
        })
      })

      it('should fail when a child fails', () => {
        transform.call(model, {
          id: '1234',
          name: 'nonconform',
          isAdmin: 'false',
        }).asObject().should.eql({
          conforms: false,
          errors: [{path: 'name', message: 'expected nonconform to match /^ABC/'}],
          value: {
            id: 1234,
            name: 'nonconform',
            isAdmin: false,
          },
        })
      })

      it('should fail when multiple children fail', () => {
        transform.call(model, {
          id: 'id',
          name: 'nonconform',
          isAdmin: 'false',
        }).asObject().should.eql({
          conforms: false,
          errors: [
            {path: 'id', message: 'expected "id" to have typeof number'},
            {path: 'name', message: 'expected nonconform to match /^ABC/'},
          ],
          value: {
            id: 'id',
            name: 'nonconform',
            isAdmin: false,
          },
        })
      })
    })

    context('when validating nested children', () => {
      let model

      beforeEach(() => {
        const nestedObject = new Model({
          type: 'object',
          children: {type: new Model({type: 'number'})},
        })

        const nestedConditional = new Model({type: 'conditional'})
          .option(new Model({type: 'number'}), 'source.type', 2)
          .option(new Model({type: 'boolean'}), 'source.type', 3)

        const children = {
          id: new Model({type: 'number'}),
          meta: nestedConditional,
          name: new Model({type: 'string'}),
          source: nestedObject,
        }

        model = new Model({type: 'object', children})
      })

      it('should succeed', () => {
        transform.call(model, {
          id: 123,
          name: 'cool name',
          source: {type: 2},
          meta: 123,
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'cool name',
            source: {type: 2},
            meta: 123,
          },
        })
      })

      it('should transform children', () => {
        transform.call(model, {
          id: 123,
          name: 'cool name',
          source: {type: '3'},
          meta: 'true',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'cool name',
            source: {type: 3},
            meta: true,
          },
        })
      })

      it('should not fail when children are missing', () => {
        transform.call(model, {
          id: 123,
          name: 'still works',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'still works',
          },
        })
      })

      it('should fail when children fail', () => {
        transform.call(model, {
          id: 123,
          name: 'other name',
          source: {type: 'other'},
          meta: 'true',
        }).asObject().should.eql({
          conforms: false,
          errors: [{path: 'source.type', message: 'expected "other" to have typeof number'}],
          value: {
            id: 123,
            name: 'other name',
            source: {type: 'other'},
            meta: 'true',
          },
        })
      })
    })
  })

  describe('#array', () => {
    const transform = transformations.array.__default

    it('should directly return values when children is not set', () => {
      const arr = []
      const obj = {property: 1}
      const model = new Model({type: 'array'})

      transform.call(model, 123).should.equal(123)
      transform.call(model, arr).should.equal(arr)
      transform.call(model, obj).should.equal(obj)
      transform.call(model, 'foobar').should.equal('foobar')
      should.equal(transform.call(model, undefined), undefined)
    })

    it('should fail when value is not an array', () => {
      (function () {
        const childModel = new Model({type: 'number'})
        const model = new Model({type: 'object', children: childModel})

        transform.call(model, 'foobar')
      }).should.throw(assert.AssertionError)
    })

    context('when validating children', () => {
      let model

      beforeEach(() => {
        model = new Model({
          type: 'array',
          children: new Model({type: 'number'}),
        })
      })

      it('should succeed', () => {
        transform.call(model, [123]).asObject().should.eql({
          conforms: true,
          errors: [],
          value: [123],
        })
      })

      it('should transform children', () => {
        transform.call(model, ['123']).asObject().should.eql({
          conforms: true,
          errors: [],
          value: [123],
        })
      })

      it('should fail when a child fails', () => {
        transform.call(model, [1, 'foo', 2]).asObject().should.eql({
          conforms: false,
          errors: [{path: '1', message: 'expected "foo" to have typeof number'}],
          value: [1, 'foo', 2],
        })
      })

      it('should fail when multiple children fail', () => {
        transform.call(model, [1, 'foo', 'bar']).asObject().should.eql({
          conforms: false,
          errors: [
            {path: '1', message: 'expected "foo" to have typeof number'},
            {path: '2', message: 'expected "bar" to have typeof number'},
          ],
          value: [1, 'foo', 'bar'],
        })
      })
    })
  })
})
