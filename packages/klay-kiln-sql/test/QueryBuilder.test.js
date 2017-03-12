defineTest('QueryBuilder.js', function (QueryBuilder) {
  describe('#toObject', function () {
    it('should return the query', function () {
      const query = {foo: 'bar'}
      const result = new QueryBuilder(null, null, query).toObject()
      result.should.eql(query)
      result.should.not.equal(query)
    });
  });

  describe('#where', function () {
    it('should set objects directly', function () {
      const result = new QueryBuilder(null, null)
        .where({myfield: {$lte: 15}})
        .toObject()
      result.should.eql({where: {myfield: {$lte: 15}}})
    })
  })

  describe('#fetchCount', function () {
    it('should fail when used without a model', function () {
      const func = () => new QueryBuilder(null, null).fetchCount()
      (func).should.throw(/no model/)
    })
  })

  describe('fetchResult', function () {
    it('should fail when used without a model', function () {
      const func = () => new QueryBuilder(null, null).fetchCount()
      (func).should.throw(/no model/)
    })
  })

  describe('fetchResults', function () {
    it('should fail when used without a model', function () {
      const func = () => new QueryBuilder(null, null).fetchCount()
      (func).should.throw(/no model/)
    })
  })
});
