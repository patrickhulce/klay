import {IGrants} from '../typedefs'

export class AuthorizationError extends Error {
  public requiredPermission: string
  public roles: string[]

  public constructor(requiredPermission: string, grants: IGrants) {
    super(`lacking permission ${requiredPermission}`)
    this.name = 'AuthorizationError'
    this.requiredPermission = requiredPermission
    this.roles = grants.roles
  }
}
