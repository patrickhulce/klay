const klay = require('klay')
const klayDb = require('../../lib/extension')

defineTest('helpers/gatherDbOptions.js', gatherDbOptions => {
  const inst = klay().use(klayDb())
  const types = inst.builders

  const children = [
    {name: 'id', model: types.integer().primaryKey().autoincrement().unique()},
    {name: 'email', model: types.string().unique()},
    {name: 'name', model: types.string().required()},
    {name: 'createdAt', model: types.date().dbindex('desc').dbautomanage('create', 'isotimestamp')},
  ]

  it('should not fail when values are undefined', () => {
    gatherDbOptions(undefined, undefined).toObject().should.eql({})
  })

  it('should preserve existing options', () => {
    const index = [{property: 'foo', direction: 'asc'}]
    const existing = {indexes: [index]}
    const results = gatherDbOptions(existing, undefined).toObject()
    results.should.eql(existing)
    results.should.not.equal(existing)
  })

  it('should collect db options from children', () => {
    const results = gatherDbOptions({}, children).toObject()
    results.should.have.property('indexes').length(1)
    results.should.have.property('constraints').length(3)
    results.should.have.property('automanaged').length(2)
  })

  it('should be idempotent', () => {
    let results = gatherDbOptions({}, children).toObject()
    results.should.have.property('indexes').length(1)
    results.should.have.property('constraints').length(3)
    results.should.have.property('automanaged').length(2)

    results = gatherDbOptions(results, children).toObject()
    results.should.have.property('indexes').length(1)
    results.should.have.property('constraints').length(3)
    results.should.have.property('automanaged').length(2)
  })

  it('should replace property names', () => {
    const results = gatherDbOptions({}, children).toObject()
    results.should.have.deep.property('indexes.0.0.property', 'createdAt')

    results.should.have.deep.property('constraints.0.properties.0', 'id')
    results.should.have.deep.property('constraints.0.name', 'primary:id')
    results.should.have.deep.property('constraints.1.properties.0', 'id')
    results.should.have.deep.property('constraints.1.name', 'unique:id')
    results.should.have.deep.property('constraints.2.properties.0', 'email')
    results.should.have.deep.property('constraints.2.name', 'unique:email')

    results.should.have.deep.property('automanaged.0.property', 'id')
    results.should.have.deep.property('automanaged.1.property', 'createdAt')
  })

  it('should filter out non-placeholder property names', () => {
    const children = [
      {
        name: 'child',
        model: types.object()
          .dbautomanageChildren('nested', 'create', 'isotimestamp')
          .dbconstrain('unique'),
      },
    ]

    const results = gatherDbOptions({}, children).toObject()
    results.should.have.property('constraints').length(1)
    results.should.not.have.property('automanage')
  })
})
