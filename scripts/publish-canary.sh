#!/bin/bash

# Check for token existence without leaking it to stdout
grep Token ~/.npmrc > /dev/null || grep Token .npmrc > /dev/null

if [ -n "$NPM_TOKEN" ]; then
  echo "Creating .npmrc file in local directory..."

  echo "//registry.npmjs.org/:username=patrickhulce" > .npmrc
  echo "//registry.npmjs.org/:email=patrick.hulce@gmail.com" >> .npmrc
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> .npmrc
elif [ $? != 0 ]; then
  echo 'No NPM Token set!'
  exit 1
fi

npm whoami || exit 1
lerna publish --canary --npm-tag=next --yes
