defineTest('QueryBuilder.js', function (QueryBuilder) {
  describe('#toObject', function () {
    it('should return the query', function () {
      new QueryBuilder(null, {}).toObject().should.eql({});
    });
  });
});
