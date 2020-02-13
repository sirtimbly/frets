#!/usr/bin/env sh

# abort on errors
set -e

npm run build

npx semantic-release
