import {values} from 'lodash'
import {IValidatorFormats, IValidatorValidations, ModelType} from '../typedefs'

function composeRegexes(regexes: RegExp[]): RegExp {
  return regexes.reduce((regexp, part) => new RegExp(regexp.source + part.source))
}

export enum StringFormat {
  UUID = 'uuid',
  Alphanumeric = 'alphanumeric',
  Hex = 'hex',
  IP = 'ip',
  URI = 'uri',
  Domain = 'domain',
  Email = 'email',
  CreditCard = 'credit-card',
}

export const formats: IValidatorFormats = {
  [ModelType.String]: values(StringFormat),
}

const ip = /(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?/i
const domain = /([0-9a-z-]+\.?)+(\.)?[0-9a-z-]+/i
const hostname = new RegExp(`(${domain.source}|${ip.source})`, 'i')
export const validations: IValidatorValidations = {
  [ModelType.String]: {
    [StringFormat.Hex]: [/^[0-9a-f]*$/i],
    [StringFormat.Alphanumeric]: [/^\w*$/i],
    [StringFormat.CreditCard]: [/^\d{13,16}$/],
    [StringFormat.UUID]: [/^[0-9a-f]{4}([0-9a-f]{4}-){4}[0-9a-f]{12}$/i],
    [StringFormat.IP]: [new RegExp(`^${ip.source}$`)],
    [StringFormat.Domain]: [new RegExp(`^${domain.source}$`, 'i')],
    [StringFormat.Email]: [composeRegexes([/^\S+@/, domain, /$/])],
    [StringFormat.URI]: [
      composeRegexes([
        /^[a-z0-9+.-]+:(\/\/)?/, // scheme
        /(\S+@)?/, // userinfo
        hostname, // hostname
        /(:\d+)?/,
      ]),
    ],
  },
}