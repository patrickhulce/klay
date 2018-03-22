import {IGrants} from '../typedefs'

export class AuthorizationError extends Error {
  public requiredPermission: string
  public role: string

  public constructor(requiredPermission: string, grants: IGrants) {
    super(`lacking permission ${requiredPermission}`)
    this.name = 'AuthorizationError'
    this.requiredPermission = requiredPermission
    this.role = grants.role!
  }
}
