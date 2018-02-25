const expect = require('chai').expect
const QueryBuilder = require('../lib/query-builder').QueryBuilder

describe('lib/query-builder.ts', () => {
  it('builds queries', () => {
    const builder = new QueryBuilder()
      .limit(10)
      .offset(50)
      .orderBy([['createdAt', 'desc']])
      .fields([['id'], ['createdAt']])
      .where('accountId', null)

    expect(builder.query).to.eql({
      limit: 10,
      offset: 50,
      order: [['createdAt', 'desc']],
      fields: [['id'], ['createdAt']],
      where: {accountId: null},
    })
  })

  describe('#constructor', () => {
    it('sets query', () => {
      const query = {limit: 1, offset: 0}
      const builder = new QueryBuilder(query)
      expect(builder.query).to.eql({limit: 1, offset: 0})
    })
  })

  describe('.where', () => {
    it('handles key value pairs', () => {
      const builder = new QueryBuilder()
      builder.where('key', '')
      builder.where('key2', {$eq: 2})
      expect(builder.query).to.eql({where: {key: '', key2: {$eq: 2}}})
    })

    it('handles multiple conditions', () => {
      const builder = new QueryBuilder({where: {key: 1}})
      builder.where({key0: 0, key2: 2})
      expect(builder.query).to.eql({where: {key0: 0, key2: 2}})
    })
  })

  describe('.clone', () => {
    it('creates a deep copy', () => {
      const builder = new QueryBuilder({})
      builder.limit(10).fields([['a'], ['b']])
      const clone = builder.clone()
      clone.query.fields.push(['c'])
      expect(builder.query).to.eql({limit: 10, fields: [['a'], ['b']]})
      expect(clone.query).to.eql({limit: 10, fields: [['a'], ['b'], ['c']]})
    })
  })
})
