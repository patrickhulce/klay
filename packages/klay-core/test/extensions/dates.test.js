const expect = require('chai').expect
const extension = require('../../dist/extensions/dates')
const utils = require('../utils')

describe('lib/extensions/dates.ts', () => {
  let coerce
  const transform = value => coerce(utils.createValidationResult(value)).value

  describe('coerce', () => {
    describe('unix', () => {
      beforeEach(() => {
        coerce = extension.coerce.date['unix-timestamp']['coerce-type']
      })

      it('should transform string values', () => {
        expect(transform('86400')).to.eql(new Date('1970-01-02T00:00:00.000Z'))
        expect(transform(String(86400 * 366))).to.eql(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should transform number values', () => {
        expect(transform(86400)).to.eql(new Date('1970-01-02T00:00:00.000Z'))
        expect(transform(86400 * 366)).to.eql(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should directly return a date value', () => {
        const d1 = new Date(2016, 4, 3)
        const d2 = new Date(1985, 2, 1)
        expect(transform(d1)).to.eql(d1)
        expect(transform(d2)).to.eql(d2)
      })

      it('should directly return all other values', () => {
        expect(() => transform('foobar')).to.throw()
        expect(() => transform({})).to.throw()
        expect(() => transform([])).to.throw()
        expect(() => transform(null)).to.throw()
        expect(() => transform(undefined)).to.throw()
      })
    })

    describe('fallback format', () => {
      beforeEach(() => {
        coerce = extension.coerce.date.___FALLBACK_FORMAT___['coerce-type']
      })

      it('should transform string values', () => {
        expect(transform('2016-01-04')).to.eql(new Date('2016-01-04T00:00:00.000Z'))
        expect(transform('1993-02-14T08:00:00.000Z')).to.eql(new Date('1993-02-14T08:00:00.000Z'))
      })

      it('should transform number values', () => {
        expect(transform(86400 * 1000)).to.eql(new Date('1970-01-02T00:00:00.000Z'))
        expect(transform(86400 * 366 * 1000)).to.eql(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should interpret ambiguous number values as javascript timestamps', () => {
        expect(transform(0)).to.eql(new Date('1970-01-01T00:00:00.000Z'))
        expect(transform(2)).to.eql(new Date('1970-01-01T00:00:00.002Z'))
      })

      it('should directly return a date value', () => {
        const d1 = new Date(2016, 4, 3)
        const d2 = new Date(1985, 2, 1)
        expect(transform(d1)).to.eql(d1)
        expect(transform(d2)).to.eql(d2)
      })

      it('should directly return all other values', () => {
        expect(() => transform('foobar')).to.throw()
        expect(() => transform({})).to.throw()
        expect(() => transform([])).to.throw()
        expect(() => transform(null)).to.throw()
        expect(() => transform(undefined)).to.throw()
      })
    })
  })
})
