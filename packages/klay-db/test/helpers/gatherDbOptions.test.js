var klay = require('klay');
var klayDb = relativeRequire('extension');

defineTest('helpers/gatherDbOptions.js', function (gatherDbOptions) {
  var inst = klay().use(klayDb());
  var types = inst.builders;

  var children = [
    {name: 'id', model: types.integer().primaryKey().autoincrement().unique()},
    {name: 'email', model: types.string().unique()},
    {name: 'name', model: types.string().required()},
    {name: 'createdAt', model: types.date().dbindex('desc').dbautomanage('create', 'isotimestamp')},
  ];

  it('should not fail when values are undefined', function () {
    gatherDbOptions(undefined, undefined).toObject().should.eql({});
  });

  it('should preserve existing options', function () {
    var index = [{property: 'foo', direction: 'asc'}];
    var existing = {indexes: [index]};
    var results = gatherDbOptions(existing, undefined).toObject();
    results.should.eql(existing);
    results.should.not.equal(existing);
  });

  it('should collect db options from children', function () {
    var results = gatherDbOptions({}, children).toObject();
    results.should.have.property('indexes').length(1);
    results.should.have.property('constraints').length(3);
    results.should.have.property('automanaged').length(2);
  });

  it('should be idempotent', function () {
    var results = gatherDbOptions({}, children).toObject();
    results.should.have.property('indexes').length(1);
    results.should.have.property('constraints').length(3);
    results.should.have.property('automanaged').length(2);

    results = gatherDbOptions(results, children).toObject();
    results.should.have.property('indexes').length(1);
    results.should.have.property('constraints').length(3);
    results.should.have.property('automanaged').length(2);
  });

  it('should replace property names', function () {
    var results = gatherDbOptions({}, children).toObject();
    results.should.have.deep.property('indexes.0.0.property', 'createdAt');

    results.should.have.deep.property('constraints.0.properties.0', 'id');
    results.should.have.deep.property('constraints.0.name', 'primary:id');
    results.should.have.deep.property('constraints.1.properties.0', 'id');
    results.should.have.deep.property('constraints.1.name', 'unique:id');
    results.should.have.deep.property('constraints.2.properties.0', 'email');
    results.should.have.deep.property('constraints.2.name', 'unique:email');

    results.should.have.deep.property('automanaged.0.property', 'id');
    results.should.have.deep.property('automanaged.1.property', 'createdAt');
  });

  it('should filter out non-placeholder property names', function () {
    var children = [
      {
        name: 'child',
        model: types.object().
          dbautomanageChildren('nested', 'create', 'isotimestamp').
          dbconstrain('unique'),
      },
    ];

    var results = gatherDbOptions({}, children).toObject();
    results.should.have.property('constraints').length(1);
    results.should.not.have.property('automanage');
  });
});
