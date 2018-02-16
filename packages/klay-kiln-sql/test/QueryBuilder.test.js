defineTest('QueryBuilder.js', QueryBuilder => {
  describe('#toObject', () => {
    it('should return the query', () => {
      const query = {foo: 'bar'}
      const result = new QueryBuilder(null, null, query).toObject()
      result.should.eql(query)
      result.should.not.equal(query)
    })
  })

  describe('#where', () => {
    it('should set objects directly', () => {
      const result = new QueryBuilder(null, null)
        .where({myfield: {$lte: 15}})
        .toObject()
      result.should.eql({where: {myfield: {$lte: 15}}})
    })
  })

  describe('#fetchCount', () => {
    it('should fail when used without a model', () => {
      const func = () => new QueryBuilder(null, null).fetchCount()
      func.should.throw(/no model/)
    })
  })

  describe('fetchResult', () => {
    it('should fail when used without a model', () => {
      const func = () => new QueryBuilder(null, null).fetchCount()
      func.should.throw(/no model/)
    })
  })

  describe('fetchResults', () => {
    it('should fail when used without a model', () => {
      const func = () => new QueryBuilder(null, null).fetchCount()
      func.should.throw(/no model/)
    })
  })
})
