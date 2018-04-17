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

# Double-check that we're logged in to npm
npm whoami || exit 1

# Get the last real release
LAST_GIT_TAG=$(git describe --abbrev=0 --tags)
TIMESTAMP_OF_LAST_TAG=$(git show -s --format="%ct" $LAST_GIT_TAG)
UNIX_TIMESTAMP=$(date +%s)
TIMESTAMP_DIFF=$(($UNIX_TIMESTAMP-$TIMESTAMP_OF_LAST_TAG))
BUILD_VERSION=$((TIMESTAMP_DIFF/60))

NEXT_NPM_PREMINOR=$(npx semver -i preminor --preid alpha $LAST_GIT_TAG)
NEXT_VERSION=$(echo $NEXT_NPM_PREMINOR | sed s/alpha.0/alpha.$BUILD_VERSION/)
# TODO: remove the --exact flag when moving back ^ dependencies
lerna publish --exact --repo-version "$NEXT_VERSION" --npm-tag=next --yes
