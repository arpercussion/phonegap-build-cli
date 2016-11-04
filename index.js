#! /usr/bin/env node --harmony

var program = require('commander'),
    co = require('co'),
    fs = require('fs'),
    prompt = require('co-prompt'),
    client = require('phonegap-build-api'),
    actions = [{
        id: 0,
        name: 'me',
        url: '/me',
        method: 'get',
        desc: 'Get a User\'s profile and resources'
    }, {
        id: 1,
        name: 'getApps',
        url: '/apps',
        method: 'get',
        desc: 'Get a User\'s apps'
    }, {
        id: 2,
        name: 'getAppById',
        url: '/apps/:app_id',
        method: 'get',
        desc: 'Get a User\'s app by id'
    }, {
        id: 3,
        name: 'downloadAppById',
        url: '/apps/:app_id/:platform',
        method: 'download',
        desc: 'Download a User\'s app by platform'
    }, {
        id: 4,
        name: 'getKeys',
        url: '/keys',
        method: 'get',
        desc: 'Get meta-data about a User\'s keys'
    }, {
        id: 5,
        name: 'getKeyByPlatformById',
        url: '/keys/:platform/:key_id',
        method: 'get',
        desc: 'Get meta-data about a specific key'
    }, {
        id: 6,
        name: 'getKeysByPlatform',
        url: '/keys/:platform',
        method: 'get',
        desc: 'Get meta-data about a User\'s platform keys'
    }, {
        id: 7,
        name: 'createApp',
        url: '/apps',
        method: 'post',
        desc: 'Create a new app'
    }, {
        id: 8,
        name: 'updateAppById',
        url: '/apps/:app_id',
        method: 'put',
        desc: 'Update an existing app'
    }, {
        id: 9,
        name: 'buildAppsById',
        url: '/apps/:app_id/build',
        method: 'post',
        desc: 'Start a build for a specific app'
    }, {
        id: 10,
        name: 'buildAppsByIdByPlatform',
        url: '/apps/:app_id/build/:platform',
        method: 'post',
        desc: 'Start a build for an app for a specific platform'
    }, {
        id: 11,
        name: 'deleteAppById',
        url: '/apps/:app_id',
        method: 'delete',
        desc: 'Delete an app'
    }, {
        id: 12,
        name: 'createKeyByPlatform',
        url: '/keys/:platform',
        method: 'post',
        desc: 'Add a signing key for a specific platform'
    }, {
        id: 13,
        name: 'updateKeyByPlatformById',
        url: '/keys/:platform/:key_id',
        method: 'put',
        desc: 'Update/Unlock a signing key for a specific platform and id'
    }, {
        id: 14,
        name: 'deleteKeyByPlatformById',
        url: '/keys/:platform/:key_id',
        method: 'delete',
        desc: 'Delete a specific key'
    }],
    getAction = function (action) {
        var i = 0,
            l = actions.length,
            f = false,
            a = (typeof action === "string") ? action.toLowerCase() : action;
        for (i; i < l; i += 1) {
            if (actions[i].id == a || actions[i].name.toLowerCase() === a) {
                f = actions[i];
                break;
            }
        }
        return f;
    },
    isAction = function (action) {
        return !!getAction(action);
    },
    platformToExtension = function (platform) {
        var ext = '';
        if (platform === 'ios') {
            ext = 'ipa';
        } else if (platform === 'android') {
            ext = 'apk';
        } else if (platform === 'windows') {
            ext = 'xap';
        }
        return ext;
    },
    execute = function (action, args) {
        client.auth({ username: args.username, password: args.password }, function (error, api) {
            if (error) {
                console.log('Error! Could not authenticate user.  ', error);
                process.exit(1);
            } else {
                // api requests
                if (action.method === 'get' || action.method === 'del') {
                    api[action.method](action.url, function (error, data) {
                        if (error) {
                            console.log('Error! Could not perform action ' + action.name, error);
                            process.exit(1);
                        } else {
                            console.log('data:', data);
                            process.exit(0);
                        }
                    });
                } else if (action.method === 'post' || action.method === 'put') {
                    api[action.method](action.url, args.payload, function (error, data) {
                        if (error) {
                            console.log('Error! Could not perform action ' + action.name, error);
                            process.exit(1);
                        } else {
                            console.log('data:', data);
                            process.exit(0);
                        }
                    });
                } else if (action.method === 'download') {
                    var file = args.app_id + platformToExtension(args.platform),
                        ws = fs.createWriteStream(file);

                    ws.on('finish', function () {
                        console.log('Download complete.  File can be found here: ' + __dirname + '/' + file);
                        process.exit(0);
                    });

                    ws.on('error', function (error) {
                        console.log('Error! Download failed.', error);
                    });

                    api.get(action.url).pipe(ws);
                }
            }
        });
    },
    processCommand = function (args) {
        var action = null;
        if (args.action && isAction(args.action)) {
            action = getAction(args.action);
            action.url = action.url
                .replace(/:app_id/, args.app_id)
                .replace(/:key_id/, args.key_id)
                .replace(/:collaborator_id/, args.collaborator_id)
                .replace(/:platform/, args.platform);
            // perform the action
            execute(action, args);
        } else {
            // no action
            console.log('Error! No action was supplied.');
            process.exit(1);
        }
    };

// Command line argument handling
program
    .arguments('<payload>')
    .option('-u, --username <username>', 'The User to authenticate as')
    .option('-p, --password <password>', 'The User\'s password')
    .option('-i, --app_id <app_id>', 'The Phonegap Build Application id')
    .option('-c, --collaborator_id <collaborator_id>', 'The Phonegap Build Collaborator id')
    .option('-k, --key_id <key_id>', 'The Phonegap Build Signing key id')
    .option('-d, --platform <platform>', 'The Phonegap Build platform')
    .option('-a, --action <action>', 'The Phonegap Build action to perform')
    .action(function (payload) {
        program.payload = payload;
    })
    .parse(process.argv);

// Prompt for username/password if not passed in
co(function *() {
    program.username = program.username || (yield prompt('username: '));
    program.password = program.password || (yield prompt.password('password: '));
    return program;
}).then(function (value) {
    // Process the command
    processCommand(value);
}, function (error) {
    console.error('Error! Could not process command line arguments.  ', error.stack);
    process.exit(1);
});