# phonegap-build-cli
Command line interface to [Node Phonegap Build Api](https://github.com/phonegap/node-phonegap-build-api)

# Install

```bash
$ npm install -g https://github.com/arpercussion/phonegap-build-cli
```

or 

```bash
$ npm install https://github.com/arpercussion/phonegap-build-cli --save-dev
```

for local use

# Usage
For global installations...

```bash
$ pg-build [options] <payload>
```

For local installations...

```bash
$ node ./node_modules/phonegap-build-cli/index.js [options] <payload>
```

# Example
```bash
$ pg-build -u username -p password -a getApps
```

Will perform a GET request to '/api/v1/apps'

```bash
$ pg-build -u username -p password -a createApp 'data={...}'
```

Will perform a POST request to '/api/v1/apps' with a json payload

```bash
$ pg-build -h
```

Wil print help


```bash
$ pg-build -l
```

Will list all available actions
