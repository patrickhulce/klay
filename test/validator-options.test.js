const expect = require('chai').expect
const Options = require('../lib/validator-options').ValidatorOptions

const emptyObj = {___ALL_FORMATS___: {}, ___FALLBACK_FORMAT___: {}}
const emptyArr = {___ALL_FORMATS___: [], ___FALLBACK_FORMAT___: []}
describe('lib/validator-options.ts', () => {
  describe('#constructor', () => {
    it('creates successfully', () => {
      const types = ['string']
      const options = new Options({types})
      expect(options.types).to.eql(['string'])
      expect(options.types).to.not.equal(types)
      expect(options.formats).to.eql({string: []})
      expect(options.coerce).to.eql({string: emptyObj})
      expect(options.validations).to.eql({string: emptyArr})
    })

    it('fills in missing formats', () => {
      const types = ['string']
      const formats = {string: ['name']}
      const options = new Options({types, formats})
      expect(options.types).to.eql(['string'])
      expect(options.types).to.not.equal(types)
      expect(options.formats).to.eql({string: ['name']})
      expect(options.formats).to.not.equal(formats)
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
        string: {___ALL_FORMATS___: {parse: parseFn}, ___FALLBACK_FORMAT___: {}},
      })
      expect(options.validations).to.eql({
        string: {___ALL_FORMATS___: [1], ___FALLBACK_FORMAT___: []},
      })
    })

    it('throws on invalid input', () => {
      expect(() => new Options({types: 'foo'})).to.throw()
      expect(() => new Options({types: {}})).to.throw()
      expect(() => new Options({types: ['string'], formats: {whaa: []}})).to.throw()
      expect(() => new Options({types: ['string'], validations: {whaa: []}})).to.throw()
      expect(() => new Options({types: ['string'], validations: {string: []}})).to.throw()
      expect(() => new Options({hooks: {value: 1}})).to.throw()
    })
  })

  describe('.clone', () => {
    it('deep clones the options', () => {
      const original = {types: ['string']}
      const optionsA = new Options(original)
      const optionsB = optionsA.clone()
      optionsA.types.push('a')
      optionsB.types.push('b')
      expect(original.types).to.eql(['string'])
      expect(optionsA.types).to.eql(['string', 'a'])
      expect(optionsB.types).to.eql(['string', 'b'])
    })

    it('deep clones the nested objects', () => {
      const parseFn = () => ''
      const allFormatsCoerce = {parse: parseFn}
      const coerce = {string: {___ALL_FORMATS___: allFormatsCoerce}}
      const original = {types: ['string'], coerce}
      const optionsA = new Options(original)
      const optionsB = optionsA.clone()
      optionsA.coerce.string.___ALL_FORMATS___.foo = 1
      optionsB.coerce.string.___ALL_FORMATS___.bar = 2
      expect(original.coerce.string.___ALL_FORMATS___).to.eql({parse: parseFn})
      expect(optionsA.coerce.string.___ALL_FORMATS___).to.eql({parse: parseFn, foo: 1})
      expect(optionsB.coerce.string.___ALL_FORMATS___).to.eql({parse: parseFn, bar: 2})
    })
  })

  describe('#from', () => {
    it('fills in missing properties', () => {
      const input = {types: ['string']}
      const options = Options.from(input)
      expect(options).to.not.equal(input)
      expect(options.types).to.eql(['string'])
      expect(options.formats).to.eql({string: []})
      expect(options.coerce).to.eql({string: emptyObj})
      expect(options.validations).to.eql({string: emptyArr})
    })

    it('reuses existing options', () => {
      const input = new Options({types: ['string']})
      const options = Options.from(input)
      expect(options).to.equal(input)
    })
  })

  describe('#merge', () => {
    it('merges two options without touching original', () => {
      const methodA = () => 1
      const methodB = () => 2
      const inputA = {types: ['string'], methods: {methodA}}
      const inputB = {types: ['number'], methods: {methodB}}
      const options = Options.merge(inputA, inputB)
      expect(options).to.eql({
        defaults: {},
        hooks: {},
        types: ['string', 'number'],
        formats: {string: [], number: []},
        methods: {methodA, methodB},
        coerce: {
          string: emptyObj,
          number: emptyObj,
        },
        validations: {
          string: emptyArr,
          number: emptyArr,
        },
      })

      expect(inputA).to.eql({types: ['string'], methods: {methodA}})
      expect(inputB).to.eql({types: ['number'], methods: {methodB}})
    })

    it('merges defaults', () => {
      const inputA = {defaults: {required: true, type: 'object'}}
      const inputB = {defaults: {required: false, type: 'string'}}
      const inputC = {defaults: {type: 'number'}}
      const options = Options.merge(inputA, inputB, inputC)
      expect(options.defaults).to.eql({required: false, type: 'number'})
    })

    it('merges hooks', () => {
      const hookA = () => 1
      const hookB = () => 2
      const inputA = {hooks: {construction: [hookA]}}
      const inputB = {hooks: {construction: [hookB]}}
      const inputC = {hooks: {'set-children': [hookB]}}
      const options = Options.merge(inputA, inputB, inputC)
      expect(options.hooks).to.eql({
        'construction': [hookA, hookB],
        'set-children': [hookB],
      })
    })

    it('merges more than two options', () => {
      const inputA = {types: ['string']}
      const inputB = {types: ['number']}
      const inputC = {types: ['array']}
      const inputD = {types: ['object']}
      const options = Options.merge(inputA, inputB, inputC, inputD)
      expect(options.types).to.eql(['string', 'number', 'array', 'object'])
    })

    it('dedupes types', () => {
      const inputA = {types: ['string']}
      const inputB = {types: ['number', 'string']}
      const options = Options.merge(inputA, inputB)
      expect(options.types).to.eql(['string', 'number'])
    })
  })
})
