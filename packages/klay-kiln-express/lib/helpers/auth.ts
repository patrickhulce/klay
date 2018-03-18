import {assert} from 'klay-core'
import {includes, template} from 'lodash'
import {IAuthConfiguration} from '../typedefs'

function serializeDomainProperties(properties: string[], object: any): string {
  return properties.map(prop => `${prop}=${object[prop]}`).join(',')
}

function assertValidDomain(domain: string): void {
  if (domain === '*') return
  assert.ok(/(\w+=\w+,?)+/.test(domain), `invalid domain: ${domain}`)
}

export function has(
  grants: Set<string>,
  scope: string,
  domains: string[] | string,
  object: any,
): boolean {
  const propertyArray = typeof domains === 'string' ? domains.split(',') : domains
  const domain = serializeDomainProperties(propertyArray, object)
  return grants.has(`${scope}!*`) || grants.has(`${scope}!${domain}`)
}

export function hasAny(
  grants: Set<string>,
  scope: string,
  domainProperties: Array<string | string[]>,
  object: any,
): boolean {
  return domainProperties.some(domain => has(grants, scope, domain, object))
}

export function computeAllScopes(scope: string, conf: IAuthConfiguration): string[] {
  const scopes: string[] = []
  const queue = [scope]
  while (queue.length) {
    const scope = queue.shift()!
    const nextScopes = conf.scopes[scope]
    assert.ok(nextScopes, `invalid scope: ${scope}`)

    for (const nextScope of nextScopes) {
      if (includes(queue, nextScope) || includes(scopes, nextScope)) continue
      queue.push(nextScope)
    }

    scopes.push(scope)
  }

  return scopes
}

export function computeAllGrants(role: string, user: any, conf: IAuthConfiguration): Set<string> {
  const grants = new Set<string>()
  assert.ok(conf.roles[role], `invalid role: ${role}`)

  for (const masterGrantTemplate of conf.roles[role]) {
    const [masterScope, domainTemplate] = masterGrantTemplate.split('!')
    const domain = template(domainTemplate)(user)
    assertValidDomain(domain)
    const scopes = computeAllScopes(masterScope, conf)
    for (const scope of scopes) {
      grants.add(`${scope}!${domain}`)
    }
  }

  return grants
}
