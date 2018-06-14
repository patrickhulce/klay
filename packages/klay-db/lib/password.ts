import * as crypto from 'crypto'
import {ICoerceFunction, IModelContext, IValidationResult, ModelType, assert} from 'klay-core'
import {promisify} from 'util'

import {IPasswordOptions, PasswordAlgorithm} from './typedefs'

const pbkdf2Async = promisify(crypto.pbkdf2)

const SALT_DELIMITER = '!'

function getHashPasswordSaltRegex(options: IPasswordOptions): RegExp {
  const hexPattern = '[a-f0-9]'
  const passwordPattern = `${hexPattern}{${options.hashedPasswordLength}}`
  const saltPattern = `${hexPattern}{${options.saltLength}}`
  return new RegExp(`^${passwordPattern}${SALT_DELIMITER}${saltPattern}$`)
}

export function getTotalPasswordLength({
  hashedPasswordLength,
  saltLength,
}: IPasswordOptions): number {
  return hashedPasswordLength + SALT_DELIMITER.length + saltLength
}

export function fillDefaultPasswordOptions(
  context: IModelContext,
  options: Partial<IPasswordOptions> = {},
): IPasswordOptions {
  const model = (options.model && options.model.clone()) || context.create({type: ModelType.String})
  const finalOptions: IPasswordOptions = {
    secret: '',
    algorithm: PasswordAlgorithm.SHA1,
    saltLength: 32,
    iterations: 1000,
    hashedPasswordLength: 32,
    ...options,
    model,
  }

  const totalLength = getTotalPasswordLength(finalOptions)
  model.max(Math.min(totalLength - 1, model.spec.max || Infinity))
  return finalOptions
}

export async function doPasswordsMatch(
  plaintext: string,
  hashedPasswordWithSalt: string,
  options: IPasswordOptions,
): Promise<boolean> {
  const [hash, salt] = hashedPasswordWithSalt.split(SALT_DELIMITER)
  assert.ok(hash.length === options.hashedPasswordLength, 'incompatible hash length')
  return hash === (await hashPasswordAsync(plaintext, salt, options))
}

export function hashPassword(plaintext: string, salt: string, options: IPasswordOptions): string {
  assert.ok(salt.length === options.saltLength, 'incompatible salt length')

  return crypto
    .pbkdf2Sync(
      plaintext,
      salt + options.secret,
      options.iterations,
      options.hashedPasswordLength / 2,
      options.algorithm,
    )
    .toString('hex')
}

export async function hashPasswordAsync(
  plaintext: string,
  salt: string,
  options: IPasswordOptions,
): Promise<string> {
  assert.ok(salt.length === options.saltLength, 'incompatible salt length')

  const hash = await pbkdf2Async(
    plaintext,
    salt + options.secret,
    options.iterations,
    options.hashedPasswordLength / 2,
    options.algorithm,
  )

  return hash.toString('hex')
}

export function createNewPasswordHashSalt(password: string, options: IPasswordOptions): string {
  // make sure it meets the model requirements first
  options.model.validate(password, {failLoudly: true})
  // hex strings are 2x number of bytes
  const salt = crypto.randomBytes(options.saltLength / 2).toString('hex')
  const hash = hashPassword(password, salt, options)
  return `${hash}${SALT_DELIMITER}${salt}`
}

export function createPasswordCoerceFn(options: IPasswordOptions): ICoerceFunction {
  const hashedRegex = getHashPasswordSaltRegex(options)

  return (result: IValidationResult): IValidationResult => {
    // We don't need to update the password return early
    if (result.value.match(hashedRegex)) return result
    // We're accepting a user password, create a new hash/salt and set the value
    return result.setValue(createNewPasswordHashSalt(result.value, options))
  }
}
