# ecobee

## Project setup
1. Create and register a pem key with Google Chrome App. Place in root of project as ecobee.pem
2. Copy env-sample.js to env.js
3. Install local chrome extension as "Load unpacked extension..." Don't worry about errors.
4. Grab ID and use in env.js for dev version.
5. Create test credential at ecobee and set Authorization edirect domain to ID.chromiumapp.org -- Chrome will catch the redirect and route it to extension.
6. Reload extension.


## Build process
1. Update manifest.json with new build number (manually controlled right now)
2. Run `./bin/build.sh ecobee` to get a dist/ecobee-REV.zip
3. Upload dist/ecobee-REV.zip to Chrom Apps.