#!/bin/bash

if [ -z "$NPM_TOKEN" ] && [ ! -e ~/.npmrc ]; then
  echo 'No NPM Token set!'
  exit 1
fi

if [ ! -e ~/.npmrc ]; then
  cat > ~/.npmrc <<EOF
username=patrickhulce
email=patrick.hulce@gmail.com
author=Patrick Hulce <patrick.hulce@gmail.com>
//registry.npmjs.org/:_authToken=$NPM_TOKEN
EOF
fi

npm whoami
npm access ls-packages
lerna publish --canary --npm-tag=next --yes || exit 1
