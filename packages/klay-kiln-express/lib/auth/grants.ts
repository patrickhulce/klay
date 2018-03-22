import {assert} from 'klay-core'
import {includes, map, template} from 'lodash'
import {IAuthConfiguration, IAuthCriteria, IGrants} from '../typedefs'

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
  role: string,
  userContext: any,
  conf: IAuthConfiguration,
): Set<string> {
  const grants = new Set<string>()
  if (!conf.roles[role]) return grants

  for (const grantDef of conf.roles[role]) {
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

function serializeCriteriaValues(criteriaValues: IAuthCriteria): string {
  return map(criteriaValues, (value, prop) => `${prop}=${value}`)
    .sort()
    .join(',')
}

export class Grants implements IGrants {
  public readonly role?: string
  private readonly _grants: Set<string>

  public constructor(role?: string, userContext?: any, conf?: IAuthConfiguration) {
    this.role = role
    this._grants = new Set()
    if (!role || !userContext || !conf) return
    this._grants = computeAllGrants(role, userContext, conf)
  }

  public has(permission: string, criteriaValues?: IAuthCriteria): boolean {
    const criteria = criteriaValues ? serializeCriteriaValues(criteriaValues) : '*'
    return this._grants.has(`${permission}!*`) || this._grants.has(`${permission}!${criteria}`)
  }
}
