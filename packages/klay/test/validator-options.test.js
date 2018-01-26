const expect = require('chai').expect
const Options = require('../lib-ts/validator-options').ValidatorOptions

const emptyObj = {___ALL_FORMATS___: {}, ___NO_FORMAT___: {}}
const emptyArr = {___ALL_FORMATS___: [], ___NO_FORMAT___: []}
describe('lib/validator-options.ts', () => {
  describe('#constructor', () => {
    it('creates successfully', () => {
      const options = new Options({types: ['string']})
      expect(options.types).to.eql(['string'])
      expect(options.formats).to.eql({string: []})
      expect(options.coerce).to.eql({string: emptyObj})
      expect(options.validations).to.eql({string: emptyArr})
    })

    it('fills in missing formats', () => {
      const options = new Options({types: ['string'], formats: {string: ['name']}})
      expect(options.types).to.eql(['string'])
      expect(options.formats).to.eql({string: ['name']})
      expect(options.coerce).to.eql({string: Object.assign({}, emptyObj, {name: {}})})
      expect(options.validations).to.eql({string: Object.assign({}, emptyArr, {name: []})})
    })

    it('allows partial definition', () => {
      const parseFn = () => ''
      const options = new Options({
        types: ['string'],
        validations: {string: {___ALL_FORMATS___: [1]}},
        coerce: {string: {___ALL_FORMATS___: {parse: parseFn}}},
      })

      expect(options.types).to.eql(['string'])
      expect(options.formats).to.eql({string: []})
      expect(options.coerce).to.eql({
        string: {___ALL_FORMATS___: {parse: parseFn}, ___NO_FORMAT___: {}},
      })
      expect(options.validations).to.eql({
        string: {___ALL_FORMATS___: [1], ___NO_FORMAT___: []},
      })
    })

    it('throws on invalid input', () => {
      expect(() => new Options({types: 'foo'})).to.throw()
      expect(() => new Options({types: {}})).to.throw()
      expect(() => new Options({types: ['string'], formats: {whaa: []}})).to.throw()
      expect(() => new Options({types: ['string'], validations: {whaa: []}})).to.throw()
      expect(() => new Options({types: ['string'], validations: {string: []}})).to.throw()
    })
  })

  describe('#sanitize', () => {
    it('fills in missing properties', () => {
      const input = {types: ['string']}
      const options = Options.sanitize(input)
      expect(options).to.not.equal(input)
      expect(options.types).to.eql(['string'])
      expect(options.formats).to.eql({string: []})
      expect(options.coerce).to.eql({string: emptyObj})
      expect(options.validations).to.eql({string: emptyArr})
    })

    it('reuses existing options', () => {
      const input = new Options({types: ['string']})
      const options = Options.sanitize(input)
      expect(options).to.equal(input)
    })
  })
})
