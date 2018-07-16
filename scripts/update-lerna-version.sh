#!/bin/bash

CURRENT_VERSION=$(git describe --tags --abbrev=0 --exclude='*-*' | grep -Eo '\d+\.\d+\.\d+')

lerna publish --skip-git --skip-npm --repo-version=$CURRENT_VERSION --exact --force-publish=* --yes
