#!/bin/bash

echo "$TRAVIS_NODE_VERSION"

if [[ "$TRAVIS_BRANCH" != "master" ]]; then
  echo "Can only publish from master"
  exit 1
fi

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

# Double-check that we're logged in to npm
npm whoami || exit 1

##### BEGIN OLD ATTEMPT #####
# Get the current real release
CURRENT_RELEASE=$(node -pe "require('./packages/klay/package.json').version")
BASELINE_TIMESTAMP=1523000000
UNIX_TIMESTAMP=$(date +%s)
TIMESTAMP_DIFF=$(($UNIX_TIMESTAMP-$BASELINE_TIMESTAMP))
BUILD_VERSION=$((TIMESTAMP_DIFF/60))

NEXT_NPM_PREMINOR=$(npx semver -i preminor --preid alpha $CURRENT_RELEASE)
NEXT_VERSION=$(echo $NEXT_NPM_PREMINOR | sed s/alpha.0/alpha.$BUILD_VERSION/)
###### END OLD ATTEMPT ######

# TODO: remove the --exact flag when moving back ^ dependencies
lerna publish --exact --canary --npm-tag=next --yes
