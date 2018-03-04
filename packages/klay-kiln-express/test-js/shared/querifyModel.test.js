const _ = require('lodash')

defineTest('shared/querifyModel.js', querifyModel => {
  it('should generate for all simple types', () => {
    const querified = querifyModel(fixtures.models.user).spec.children
    querified.should.have.length(9)
  })

  it('should make values optional and remove the default', () => {
    const querified = querifyModel(fixtures.models.user).spec.children
    querified.forEach(item => {
      item.model.spec.should.not.have.property('default')
      item.model.spec.should.have.property('required', false)
    })
  })

  it('should only include requested values', () => {
    const querified = querifyModel(fixtures.models.user, {equality: ['age']}).spec.children
    querified.should.have.length(1)
  })

  describe('#validate', () => {
    let model

    beforeEach(() => {
      model = querifyModel(fixtures.models.user, {range: true})
    })

    it('should coerce strings', () => {
      const results = model.validate({firstName: 'foo'})
      results.should.have.property('conforms', true)
      results.should.have.deep.property('value.firstName.$eq', 'foo')
    })

    it('should coerce numbers', () => {
      const results = model.validate({age: '15'})
      results.should.have.property('conforms', true)
      results.should.have.deep.property('value.age.$eq', 15)
    })

    it('should coerce booleans', () => {
      const results = model.validate({isAdmin: 'false'})
      results.should.have.property('conforms', true)
      results.should.have.deep.property('value.isAdmin.$eq', false)
    })

    it('should respect multiple filters', () => {
      const results = model.validate({age: {$gte: '20', $lt: '30'}})
      results.should.have.property('conforms', true)
      results.should.have.deep.property('value.age.$gte', 20)
      results.should.have.deep.property('value.age.$lt', 30)
    })

    it('should recognize non-conformant input', () => {
      model.validate({age: {$wtf: 30}}).should.have.property('conforms', false)
      model.validate({age: {$gte: 17.3}}).should.have.property('conforms', false)
      model.validate({isAdmin: 'foo'}).should.have.property('conforms', false)
    })
  })
})
