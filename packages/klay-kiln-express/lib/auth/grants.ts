import {assert} from 'klay-core'
import {includes, map, template} from 'lodash'
import {IAuthConfiguration, IAuthCriteriaPropertyValues, IGrants} from '../typedefs'

function assertValidCriteria(criteria: string): void {
  if (criteria === '*') return
  assert.ok(/(.+=.+,?)+/.test(criteria), `invalid criteria: ${criteria}`)
}

export function computeAllPermissions(permission: string, conf: IAuthConfiguration): string[] {
  const permissions: string[] = []
  const queue = [permission]
  while (queue.length) {
    const permission = queue.shift()!
    const nextpermissions = conf.permissions[permission]
    assert.ok(nextpermissions, `invalid permission: ${permission}`)

    for (const nextpermission of nextpermissions) {
      if (includes(queue, nextpermission) || includes(permissions, nextpermission)) continue
      queue.push(nextpermission)
    }

    permissions.push(permission)
  }

  return permissions
}

export function computeAllGrants(
  roles: string,
  userContext: any,
  conf: IAuthConfiguration,
): Set<string> {
  const grants = new Set<string>()
  if (!conf.roles[roles]) return grants

  for (const grantDef of conf.roles[roles]) {
    const criteriaTemplate =
      typeof grantDef.criteria === 'string' ? grantDef.criteria : grantDef.criteria.sort().join(',')
    const criteria = template(criteriaTemplate || '*')(userContext)
    assertValidCriteria(criteria)
    const permissions = computeAllPermissions(grantDef.permission, conf)
    for (const permission of permissions) {
      grants.add(`${permission}!${criteria}`)
    }
  }

  return grants
}

function serializeCriteriaValues(criteriaValues: IAuthCriteriaPropertyValues): string {
  return map(criteriaValues, (value, prop) => `${prop}=${value}`)
    .sort()
    .join(',')
}

export class Grants implements IGrants {
  public readonly roles: string[]
  public readonly userContext?: any
  private readonly _grants: Set<string>

  public constructor(roles?: string[], userContext?: any, conf?: IAuthConfiguration) {
    this.roles = roles || []
    this.userContext = userContext
    this._grants = new Set()
    if (!roles || !userContext || !conf) return

    for (const role of roles) {
      for (const grant of computeAllGrants(role, userContext, conf)) {
        this._grants.add(grant)
      }
    }
  }

  public has(permission: string, criteriaValues?: IAuthCriteriaPropertyValues): boolean {
    const criteria = criteriaValues ? serializeCriteriaValues(criteriaValues) : '*'
    return this._grants.has(`${permission}!*`) || this._grants.has(`${permission}!${criteria}`)
  }
}
