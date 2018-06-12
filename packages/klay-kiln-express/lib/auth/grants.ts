import {assert} from 'klay-core'
import {includes, map, sortBy, template} from 'lodash'

import {
  IAuthConfiguration,
  IAuthCriteriaPropertyValues,
  IGrants,
} from '../typedefs'

import {ICriteriaDefinition} from './typedefs'

function assertValidCriteria(criteria: string | ICriteriaDefinition): void {
  if (criteria === '*') return
  assert.ok(
    typeof criteria === 'object' && !Array.isArray(criteria) && Object.keys(criteria).length,
    'invalid criteria',
  )
}

function computeCriteriaProperties(criteria: string | ICriteriaDefinition): string[] {
  if (criteria === '*') return []
  return Object.keys(criteria).sort()
}

function computeGrantCriteria(criteria: string | ICriteriaDefinition, userContext: any): string {
  if (criteria === '*') return criteria

  const criteriaValues = map(criteria, (rawValue, key) => {
    let value = rawValue
    if (typeof rawValue === 'string') {
      value = template(rawValue)(userContext)
      if (/^\d+$/.test(value)) value = Number.parseInt(value)
    }

    return [key, value]
  })

  return JSON.stringify(sortBy(criteriaValues, '0'))
}

function serializeCriteriaValues(criteriaValues: IAuthCriteriaPropertyValues): string {
  return JSON.stringify(sortBy(map(criteriaValues, (value, prop) => [prop, value]), '0'))
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
): [Set<string>, Map<string, string[][]>] {
  const grants = new Set<string>()
  const permissionProperties = new Map<string, string[][]>()
  if (!conf.roles[role]) return [grants, permissionProperties]

  for (const grantDef of conf.roles[role]) {
    assertValidCriteria(grantDef.criteria)
    const criteria = computeGrantCriteria(grantDef.criteria, userContext)
    const criteriaProperties = computeCriteriaProperties(grantDef.criteria)
    const permissions = computeAllPermissions(grantDef.permission, conf)
    for (const permission of permissions) {
      grants.add(`${permission}!${criteria}`)

      const permissionSets = permissionProperties.get(permission) || []
      if (criteriaProperties.length) permissionSets.push(criteriaProperties)
      permissionProperties.set(permission, permissionSets)
    }
  }

  return [grants, permissionProperties]
}

export class Grants<T = any> implements IGrants<T> {
  public readonly roles: string[]
  public readonly userContext?: any
  private readonly _permissionProperties: Map<string, string[][]>
  private readonly _grants: Set<string>

  public constructor(roles?: string[], userContext?: any, conf?: IAuthConfiguration) {
    this.roles = roles || []
    this.userContext = userContext
    this._grants = new Set()
    this._permissionProperties = new Map()
    if (!roles || !userContext || !conf) return

    for (const role of roles) {
      const [grants, permissionProperties] = computeAllGrants(role, userContext, conf)
      for (const grant of grants) {
        this._grants.add(grant)
      }

      for (const [permission, values] of permissionProperties) {
        const existing = this._permissionProperties.get(permission) || []
        this._permissionProperties.set(permission, existing.concat(values))
      }
    }
  }

  public has(permission: string, criteriaValues?: IAuthCriteriaPropertyValues): boolean {
    const criteria = criteriaValues ? serializeCriteriaValues(criteriaValues) : '*'
    return this._grants.has(`${permission}!*`) || this._grants.has(`${permission}!${criteria}`)
  }

  public getPropertyValuesForPermission(permission: string): string[][] {
    return this._permissionProperties.get(permission) || []
  }
}
