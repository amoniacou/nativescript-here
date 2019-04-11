#!/bin/bash

PACK_DIR=package;

publish() {
    cd $PACK_DIR
    echo 'Publishing to npm...'
    npm set registry https://npm.dev.amoniac.eu
    npm set ca null 
    npm publish *.tgz --registry https://npm.dev.amoniac.eu --loglevel silly
}

./pack.sh && publish