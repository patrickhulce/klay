const extension = require('../../lib/extensions/strings')

const testValues = shouldPass => (values, funcs) => {
  for (const value of values) {
    for (const func of funcs) {
      shouldPass
        ? expect(() => func({value})).not.toThrowError()
        : expect(() => func({value})).toThrowError()
    }
  }
}

const testPassingValues = testValues(true)
const testFailingValues = testValues(false)
describe('lib/extensions/strings.ts', () => {
  describe.skip('#transformations', () => {
    describe('creditCard', () => {
      const transform = () => undefined
      it('should remove dashes and spaces', () => {
        expect(transform('444-4444-4444')).toBe('44444444444')
        expect(transform('444 4444 4444')).toBe('44444444444')
      })

      it('should not remove dashes and spaces when non-string', () => {
        const obj = {}
        expect(transform(12)).toBe(12)
        expect(transform(obj)).toBe(obj)
      })
    })
  })

  describe('#validations', () => {
    describe('uuid', () => {
      const validate = extension.validations.string.uuid

      it('should pass valid values', () => {
        testPassingValues(
          [
            '11111111-1111-1111-1111-111111111111',
            '1e1af1d1-2111-4111-1121-1a1e111ec111',
            '8aebedcd-474d-4a32-bd7e-425b92834fb3',
            'f83b75b8-8387-4657-9e56-fb7a501ca578',
            '367aa2b0-52e4-11e6-beb8-9e71128cae77',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            ' 11111111-1111-1111-1111-111111111111',
            '11111111-1111-1111-1111-111111111111 ',
            '11111111-1111-1111- 1111-111111111111 ',
            '11111111-1111-1111-1111-11111111111g',
            '11111111-1111-1111-1111-11111111111',
            '1e1af1d1-2111-4111-112-1a1e111ec111',
            '8aebedcd-474d-4a3-bd7e-425b92834fb3',
            'f83b75b8-887-4657-9e56-fb7a501ca578',
            '367aa2b-52e4-11e6-beb8-9e71128cae77',
            '367aa2b052e411e6beb89e71128cae77',
          ],
          validate,
        )
      })
    })

    describe('alphanumeric', () => {
      const validate = extension.validations.string.alphanumeric

      it('should pass valid values', () => {
        testPassingValues(
          [
            '',
            'A',
            '112',
            'DFfa234',
            '15cyA7uYR4y4CpLuhMfaQ0tTeKDrf5S',
            'g1dNsuxnFYQeZzFyd4vfmNyCGarkzal',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            ' asdf',
            '12 23',
            'foo ',
            'asdf-sfasf-sfsdf-sasdf',
            '1231-123123',
            'asfafs14234$%@#sdf',
            'FSdioJFEJW\nasdf',
          ],
          validate,
        )
      })
    })

    describe('hex', () => {
      const validate = extension.validations.string.hex

      it('should pass valid values', () => {
        testPassingValues(
          [
            '',
            'A',
            '112',
            'DFfa234',
            '367aa2b052e411e6beb89e71128cae77',
            'df42447a701d4d0f9506e9087bb604a0',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            'asdf fasd',
            ' abcdef',
            'abcdef ',
            'abc def',
            '12 23',
            'asdf-sfasf-sfsdf-sasdf',
            '1231-123123',
            'abcdef%@#abcdef',
            'FSdioJFEJWasdf',
          ],
          validate,
        )
      })
    })

    describe('ip', () => {
      const validate = extension.validations.string.ip

      it('should pass valid values', () => {
        testPassingValues(
          [
            '172.32.0.1',
            '192.168.0.1',
            '10.10.0.1',
            '255.255.255.0',
            '8.8.8.8',
            '75.75.75.75',
            '10.0.0.0/8',
            '172.20.0.0/16',
            '192.168.0.0/24',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            'asdf fasd',
            '12 23',
            '172.32.0.1 ',
            ' 172.32.0.1',
            '172. 32.0.1',
            'asdf-sfasf-sfsdf-sasdf',
            '1231-123123',
            'abcdef%@#abcdef',
            'FSdioJFEJWasdf',
          ],
          validate,
        )
      })
    })

    describe('uri', () => {
      const validate = extension.validations.string.uri

      it('should pass valid values', () => {
        testPassingValues(
          [
            'http://www.foo-bar.com/asdfsfd?asdfsf#go',
            'https://192.168.0.0:3200/something?user=#other',
            'ftp://user:password@home.net/my/folder',
            'ssh://git@github.com:patrickhulce/klay',
            'git+https://github.com/patrickhulce/klay',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            'www.google.com',
            ' http://www.foo-bar.com/asdfsfd?asdfsf#go',
            'http:/my-something',
            'sdf%#://#%@asdf',
            'asdfasfasfd',
            '23423423423',
            'asdf asdf',
          ],
          validate,
        )
      })
    })

    describe('domain', () => {
      const validate = extension.validations.string.domain

      it('should pass valid values', () => {
        testPassingValues(
          [
            'www.foo-bar.com',
            'home.net',
            'github.com',
            'something.private.domain',
            'other-123.local',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            '192.168.0.0/24',
            ' www.foobar.com',
            'home.net ',
            'git hub.com',
            'http:/my-something',
            'sdf%#://#%@asdf',
            'asdfas fasfd',
            '23 423423423',
            'asdf asdf',
          ],
          validate,
        )
      })
    })

    describe('email', () => {
      const validate = extension.validations.string.email

      it('should pass valid values', () => {
        testPassingValues(
          [
            'me@www.foo-bar.com',
            'me+spam@home.net',
            'other.special@github.com',
            'math123@cool.co.uk',
            'admin@localhost',
            'foo+.sf@other-123.local',
          ],
          validate,
        )
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            '192.168.0.0/24',
            ' me@foobar.com',
            'you@home.net ',
            't@git hub.com',
            'http:/my-something',
            'sdf%#://#%asdf',
            'asdfasfasfd',
            '23423423423',
            'asdf asdf',
          ],
          validate,
        )
      })
    })

    describe('creditCard', () => {
      const validate = extension.validations.string['credit-card']

      it('should pass valid values', () => {
        testPassingValues(['4123412341234123', '4123412341234', '567256725672562'], validate)
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            '567256725672562232',
            '41-234-12341-234-123',
            '41 234 12341234 123',
            '4123-4123',
            '1234242234',
          ],
          validate,
        )
      })
    })

    describe('date', () => {
      const validate = extension.validations.string.date

      it('should pass valid values', () => {
        testPassingValues(['1993-02-13', '1993.2.1', '2014.12.27', '2014/12/27'], validate)
      })

      it('should fail invalid values', () => {
        testFailingValues(['1993-22-3', '1-2-3', '2005 12 3', '2005-03-43', '2005-23-9'], validate)
      })
    })

    describe('state', () => {
      const validate = extension.validations.string.state

      it('should pass valid values', () => {
        testPassingValues(['AK', 'TN', 'TX', 'CA'], validate)
      })

      it('should fail invalid values', () => {
        testFailingValues(
          [
            'TNN',
            'tn',
            'Tx',
            // TODO: allow full state representations
            'California',
            'Tennessee',
          ],
          validate,
        )
      })
    })

    describe('zipcode', () => {
      const validate = extension.validations.string.zipcode

      it('should pass valid values', () => {
        testPassingValues(['12345', '12345-1234', '04231', '94040'], validate)
      })

      it('should fail invalid values', () => {
        testFailingValues(['123456789', '12345 1234', ' 12345-1234 '], validate)
      })
    })
  })
})
