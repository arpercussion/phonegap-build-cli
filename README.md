# phonegap-build-cli
Command line interface to [Node Phonegap Build Api](https://github.com/phonegap/node-phonegap-build-api)

# Install
npm install -g https://github.com/arpercussion/phonegap-build-cli

or 

npm install https://github.com/arpercussion/phonegap-build-cli --save-dev

for local use

# Usage

For global installations...

$ pg-build [options] <payload>

For local installations...

$ node ./node_modules/phonegap-build-cli/index.js [options] <payload>

# Example

pg-build -u username -p password -a getApps

Will perform a GET request to '/api/v1/apps'

pg-build -u username -p password -a createApp 'data={...}'

Will perform a POST request to '/api/v1/apps' with a json payload
