#!/bin/bash

PACK_DIR=package;

publish() {
    cd $PACK_DIR
    echo 'Publishing to fury...'
    curl https://18fCGG-6KXyjvQynLxBmkkKMZRvwpyli84@push.fury.io/amoniacou/ --progress-bar -F package=@nativescript-here-0.1.1.tgz
}

./pack.sh && publish