#!/bin/bash

if [ -z "$NPM_TOKEN" ] && [ ! -e ~/.npmrc ]; then
  echo 'No NPM Token set!'
  exit 1
fi

if [ ! -e ~/.npmrc ]; then
  echo "Creating .npmrc file..."

  echo "//registry.npmjs.org/:username=patrickhulce" > ~/.npmrc
  echo "//registry.npmjs.org/:email=patrick.hulce@gmail.com" >> ~/.npmrc
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc
fi

head -n 2 ~/.npmrc

npm whoami || exit 1
npm access ls-packages
lerna publish --canary --npm-tag=next --yes
