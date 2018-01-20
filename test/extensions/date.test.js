const should = require('chai').should()

const Model = relativeRequire('Model.js')

defineTest('extensions/date.js', dateFactory => {
  const extension = dateFactory(spec => new Model(spec))

  describe('#builders', () => {
    beforeEach(() => {
      Model.types = ['date']
      Model.formats.date = ['unix']
    })

    afterEach(() => {
      Model.reset()
    })

    const builders = extension.builders
    describe('date', () => {
      it('should create a model with type date', () => {
        const model = builders.date()
        model.should.have.nested.property('spec.type', 'date')
      })
    })

    describe('unix', () => {
      it('should create a model with type date and format unix', () => {
        const model = builders.unixtimestamp()
        model.should.have.nested.property('spec.type', 'date')
        model.should.have.nested.property('spec.format', 'unix')
      })
    })
  })

  describe('#transformations', () => {
    describe('unix', () => {
      const transform = extension.transformations.date.unix

      it('should transform string values', () => {
        transform('86400').should.eql(new Date('1970-01-02T00:00:00.000Z'))
        transform(String(86400 * 366)).should.eql(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should transform number values', () => {
        transform(86400).should.eql(new Date('1970-01-02T00:00:00.000Z'))
        transform(86400 * 366).should.eql(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should directly return a date value', () => {
        const d1 = new Date(2016, 4, 3)
        const d2 = new Date(1985, 2, 1)
        transform(d1).should.equal(d1)
        transform(d2).should.equal(d2)
      })

      it('should directly return all other values', () => {
        const obj = {}
        const arr = []

        transform('foobar').should.equal('foobar')
        transform(obj).should.equal(obj)
        transform(arr).should.equal(arr)
        should.equal(transform(null), null)
        should.equal(transform(undefined), undefined)
      })
    })

    describe('__default', () => {
      const transform = extension.transformations.date.__default

      it('should transform string values', () => {
        transform('2016-01-04').should.eql(new Date('2016-01-04T00:00:00.000Z'))
        transform('1993-02-14T08:00:00.000Z').should.eql(new Date('1993-02-14T08:00:00.000Z'))
      })

      it('should transform number values', () => {
        transform(86400 * 1000).should.eql(new Date('1970-01-02T00:00:00.000Z'))
        transform(86400 * 366 * 1000).should.eql(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should interpret ambiguous number values as javascript timestamps', () => {
        transform(0).should.eql(new Date('1970-01-01T00:00:00.000Z'))
        transform(2).should.eql(new Date('1970-01-01T00:00:00.002Z'))
      })

      it('should directly return a date value', () => {
        const d1 = new Date(2016, 4, 3)
        const d2 = new Date(1985, 2, 1)
        transform(d1).should.equal(d1)
        transform(d2).should.equal(d2)
      })

      it('should directly return all other values', () => {
        const obj = {}
        const arr = []

        transform('foobar').should.equal('foobar')
        transform(obj).should.equal(obj)
        transform(arr).should.equal(arr)
        should.equal(transform(null), null)
        should.equal(transform(undefined), undefined)
      })
    })
  })

  describe('#validations', () => {
    describe('__default', () => {
      const validate = extension.validations.date.__default
      it('should pass valid date values', () => {
        (function () {
          validate(new Date())
          validate(new Date('2016-01-02'))
        }).should.not.throw()
      })

      it('should fail invalid values', () => {
        [
          () => validate(null),
          () => validate(undefined),
          () => validate(false),
          () => validate(1231235),
          () => validate('2016-01-12'),
          () => validate(new Date('unknown')),
        ].forEach(f => f.should.throw())
      })
    })
  })
})
