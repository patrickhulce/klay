#!/bin/bash

PROJECT_DIR=../..
PACKAGE=${PWD##*/}
mkdir -p $PROJECT_DIR/docs/$PACKAGE
typedoc --mode file --out $PROJECT_DIR/docs/$PACKAGE ./lib

cat > $PROJECT_DIR/docs/index.html <<EOF
<html>
<body>
<script>window.location = './klay/';</script>
EOF
