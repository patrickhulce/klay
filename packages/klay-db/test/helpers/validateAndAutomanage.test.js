/* eslint-disable no-use-extend-native/no-use-extend-native */
const _ = require('lodash')
const klay = require('klay')
const klayDb = require('../../lib/extension')

defineTest('helpers/validateAndAutomanage.js', validateAndAutomanageFactory => {
  let types, children, model

  beforeEach(() => {
    const inst = klay().use(klayDb())
    types = inst.builders

    children = [
      {name: 'id', model: types.integerId().required()},
      {name: 'longId', model: types.uuid().dbautomanage('create', 'uuid')},
      {name: 'email', model: types.string()},
      {name: 'age', model: types.integer().required()},
      {name: 'name', model: types.string().required()},
      {name: 'checksum', model: types.string().required()
        .dbautomanage('*', 'post-validate', item => (item.age * 5) + item.name)},
      {name: 'changed', model: types.boolean()
        .dbautomanage('create', () => false)
        .dbautomanage('update', () => true)},
      {name: 'createdAt', model: types.createdAt()},
      {name: 'updatedAt', model: types.updatedAt()},
    ]

    model = types.object(children)
  })

  context('when event is create', () => {
    let validateAndAutomanage

    beforeEach(() => {
      validateAndAutomanage = validateAndAutomanageFactory(model, 'create')
    })

    it('should validate the object', () => {
      const results = validateAndAutomanage({age: '17'})
      results.should.have.property('conforms', false)
      results.should.have.property('errors').eql([
        {path: 'name', message: 'expected value to be defined'},
      ])
    })

    it('should transform the object', () => {
      const results = validateAndAutomanage({name: 'John', age: '22'})
      results.should.have.property('conforms', true)
      results.should.have.deep.property('value.age', 22)
    })

    it('should create the pre-validate automanaged properties', () => {
      const results = validateAndAutomanage({name: 'Jack', age: '63'})
      results.value.should.have.property('changed', false)
      results.value.should.have.property('createdAt').instanceof(Date)
      results.value.should.have.property('updatedAt').instanceof(Date)
      results.value.should.have.property('longId').match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/)
    })

    it('should create the post-validate automanaged properties', () => {
      const results = validateAndAutomanage({name: 'Jill', age: '17'})
      results.value.should.have.property('checksum', '85Jill')
    })

    it('should not validate on insert properties', () => {
      const results = validateAndAutomanage({id: 12, name: 'Jill', age: '17'})
      results.errors.should.eql([
        {path: 'id', message: 'expected 12 to have typeof undefined'},
      ])
    })

    it('should fail loudly when options dictate', () => {
      (function () {
        validateAndAutomanage({}, {failLoudly: true})
      }).should.throw(/expected value to be defined/)
    })
  })

  context('when event is update', () => {
    let validateAndAutomanage, base

    beforeEach(() => {
      validateAndAutomanage = validateAndAutomanageFactory(model, 'update')
      base = {id: '12', createdAt: '1970-01-01'}
    })

    it('should validate the object', () => {
      const results = validateAndAutomanage({age: '17'})
      results.should.have.property('conforms', false)
      results.should.have.property('errors').eql([
        {path: 'id', message: 'expected value to be defined'},
        {path: 'name', message: 'expected value to be defined'},
        {path: 'createdAt', message: 'expected value to be defined'},
      ])
    })

    it('should transform the object', () => {
      const results = validateAndAutomanage({
        id: '12',
        name: 'John',
        age: '22',
        createdAt: '1970-01-01',
      })

      results.should.have.property('conforms', true)
      results.should.have.deep.property('value.id', 12)
      results.should.have.deep.property('value.age', 22)
      results.should.have.deep.property('value.createdAt').eql(new Date(0))
    })

    it('should create the pre-validate automanaged properties', () => {
      const results = validateAndAutomanage(_.assign({name: 'Jack', age: '63'}, base))
      results.value.should.have.property('changed', true)
      results.value.should.have.property('updatedAt').instanceof(Date)
    })

    it('should create the post-validate automanaged properties', () => {
      const results = validateAndAutomanage(_.assign({name: 'Jennie', age: '20'}, base))
      results.value.should.have.property('checksum', '100Jennie')
    })

    it('should fail loudly when options dictate', () => {
      (function () {
        validateAndAutomanage({}, {failLoudly: true})
      }).should.throw(/expected value to be defined/)
    })
  })
})
