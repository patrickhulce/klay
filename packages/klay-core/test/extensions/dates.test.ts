const extension = require('../../lib/extensions/dates')
const utils = require('../utils')

describe('lib/extensions/dates.ts', () => {
  let coerce
  const transform = value => coerce(utils.createValidationResult(value)).value

  describe('coerce', () => {
    describe('unix', () => {
      beforeEach(() => {
        coerce = extension.coerce['date-time']['unix-timestamp']['coerce-type']
      })

      it('should transform string values', () => {
        expect(transform('86400')).toEqual(new Date('1970-01-02T00:00:00.000Z'))
        expect(transform(String(86400 * 366))).toEqual(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should transform number values', () => {
        expect(transform(86400)).toEqual(new Date('1970-01-02T00:00:00.000Z'))
        expect(transform(86400 * 366)).toEqual(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should directly return a date value', () => {
        const d1 = new Date(2016, 4, 3)
        const d2 = new Date(1985, 2, 1)
        expect(transform(d1)).toEqual(d1)
        expect(transform(d2)).toEqual(d2)
      })

      it('should directly return all other values', () => {
        expect(() => transform('foobar')).toThrowError()
        expect(() => transform({})).toThrowError()
        expect(() => transform([])).toThrowError()
        expect(() => transform(null)).toThrowError()
        expect(() => transform(undefined)).toThrowError()
      })
    })

    describe('fallback format', () => {
      beforeEach(() => {
        coerce = extension.coerce['date-time'].___FALLBACK_FORMAT___['coerce-type']
      })

      it('should transform string values', () => {
        expect(transform('2016-01-04')).toEqual(new Date('2016-01-04T00:00:00Z'))
        expect(transform('1993-02-14T08:00:00.000Z')).toEqual(new Date('1993-02-14T08:00:00.000Z'))
      })

      it('should transform number values', () => {
        expect(transform(86400 * 1000)).toEqual(new Date('1970-01-02T00:00:00.000Z'))
        expect(transform(86400 * 366 * 1000)).toEqual(new Date('1971-01-02T00:00:00.000Z'))
      })

      it('should interpret ambiguous number values as javascript timestamps', () => {
        expect(transform(0)).toEqual(new Date('1970-01-01T00:00:00.000Z'))
        expect(transform(2)).toEqual(new Date('1970-01-01T00:00:00.002Z'))
      })

      it('should directly return a date value', () => {
        const d1 = new Date(2016, 4, 3)
        const d2 = new Date(1985, 2, 1)
        expect(transform(d1)).toEqual(d1)
        expect(transform(d2)).toEqual(d2)
      })

      it('should directly return all other values', () => {
        expect(() => transform('foobar')).toThrowError()
        expect(() => transform({})).toThrowError()
        expect(() => transform([])).toThrowError()
        expect(() => transform(null)).toThrowError()
        expect(() => transform(undefined)).toThrowError()
      })
    })
  })
})
