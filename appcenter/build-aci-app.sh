#!/bin/bash

echo "Building Reattivio"
npm run build

echo "Removing old assets"
rm -rf ./app/UIAssets/build

echo "Copying application assets"
cp ../index.html ./app/UIAssets/app.html
cp -R ../build/ ./app/UIAssets/build

echo "Building ACI application package"
base=`pwd`
python aci_app_packager.py -f $base/app

