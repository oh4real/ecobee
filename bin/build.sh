#! /bin/sh

function addKey {
	# cp KEY into Extension as key.pem
	echo "cp $KEY build/$EXT/key.pem"
	cp $KEY build/$EXT/key.pem
}

function zipExtension {
	cd build
	# Now ZIP the extension without gitness
	echo "zip -r $OUTPUT $EXT -x \*.git*"
	zip -r ../$OUTPUT $EXT -x \*.git*
	cd ..
}

function renameZipByVersion {
	# Now rename zip
	echo mv $OUTPUT $ZIP
	mv $OUTPUT $ZIP
}

if [ -z $1 ] 
	then
		echo "An extension name must be included";
		exit 1;
fi

EXT=$1
VERSION=`./bin/jq '.version' src/manifest.json -r`
OUTPUT="dist/${EXT}.zip"
ZIP="dist/${EXT}-${VERSION}.zip"
KEY="${EXT}.pem"

# clean and make target build/dist
rm -rf dist build
mkdir -p dist build/$EXT
cp -R src/* build/$EXT

if [ -f $ZIP ] 
	then
		echo "A zip of the version number already exists: $ZIP";
		exit 1;
fi

addKey
zipExtension
renameZipByVersion