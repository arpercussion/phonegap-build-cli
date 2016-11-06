#! /usr/bin/env node --harmony

var program = require('commander'),
    co = require('co'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    prompt = require('co-prompt'),
    client = require('phonegap-build-api'),
    Table = require('easy-table'),
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
    format = function (s) {
        var i, reg, count = arguments.length - 1;
        for (i = 0; i < count; i += 1) {
            reg = new RegExp('\\{' + i + '\\}', 'gm');
            s = s.replace(reg, arguments[i + 1]);
        }
        return s;
    },
    isNullOrEmpty = function (o) {
        return o === undefined || !o || o.length <= 0 || o === '';
    },
    endsWith = function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },
    getAction = function (action) {
        // find action by id or name
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
    handleError = function (msg, error, exit) {
        var metadata = '';
        if (!isNullOrEmpty(error)) {
            if (typeof error === 'object') {
                try {
                    metadata = JSON.stringify(error);
                } catch (e) {
                    metadata = 'Could not parse extra error information';
                }
            } else {
                metadata = error;
            }
        }

        console.log(msg, metadata);
        if (exit) {
            process.exit(1);
        }
    },
    printActions = function () {
        // Print out the list of available actions
        var i = 0,
            l = actions.length,
            t = new Table();

        for (i; i < l; i += 1) {
            var action = actions[i];
            t.cell('Name', action.name);
            t.cell('Description', action.desc);
            t.cell('Url', action.url);
            t.newRow()
        }
        console.log('List of actions:');
        console.log('');
        console.log(t.toString());
    },
    printValidations = function (vs) {
        // Print out the list of validation errors
        var i = 0,
            l = vs.length,
            t = new Table();

        for (i; i < l; i += 1) {
            var v = vs[i];
            t.cell('Action', v.action);
            t.cell('Message', v.message);
            t.newRow()
        }
        console.log('Validation errors occurred:');
        console.log('');
        console.log(t.toString());
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
    getFile = function (args) {
        var id = args.app_id,
            platform = args.platform,
            ext = platformToExtension(platform),
            dir = os.tmpdir(),
            loc = format('{0}{1}{2}_{3}.{4}', dir, path.sep, id, platform, ext);
        return loc;
    },
    execute = function (action, args) {
        client.auth({ username: args.username, password: args.password }, function (error, api) {
            var file, ws;

            if (error) {
                handleError('Error! Could not authenticate user.  ', error, true);
            } else {
                // api requests
                if (action.method === 'get' || action.method === 'del') {
                    api[action.method](action.murl, function (error, data) {
                        if (error) {
                            handleError('Error! Could not perform action ' + action.name, error, true);
                        } else {
                            console.log('data:', data);
                            process.exit(0);
                        }
                    });
                } else if (action.method === 'post' || action.method === 'put') {
                    api[action.method](action.murl, args.payload, function (error, data) {
                        if (error) {
                            handleError('Error! Could not perform action ' + action.name, error, true);
                        } else {
                            console.log('data:', data);
                            process.exit(0);
                        }
                    });
                } else if (action.method === 'download') {
                    file = getFile(args);
                    ws = fs.createWriteStream(file);

                    ws.on('open', function () {
                        console.log('Download starting...');
                    });

                    ws.on('finish', function () {
                        console.log('Download complete.  File can be found here: ' + __dirname + '/' + file);
                        process.exit(0);
                    });

                    ws.on('error', function (error) {
                        handleError('Error! Download failed.', error, true);
                    });

                    api.get(action.murl).pipe(ws);
                }
            }
        });
    },
    validate = function (action, args) {
        // Validate the arguments for the action
        // has app_id
        var validations = [];
        if ([2, 3, 8, 9, 10, 11].indexOf(action.id) !== -1 && isNullOrEmpty(args.app_id)) {
            validations.push({ action: action.url, message: 'A valid app id must be supplied' });
        }
        // platform_id
        if ([3, 5, 6, 10, 12, 13, 14].indexOf(action.id) !== -1 && isNullOrEmpty(args.platform)) {
            validations.push({ action: action.url, message: 'A platform (ios, android,...) must by supplied' });
        }
        // key_id
        if ([5, 13, 14].indexOf(action.id) !== -1 && isNullOrEmpty(args.key_id)) {
            validations.push({ action: action.url, message: 'A valid key id must be supplied' });
        }
        // has payload
        if ([7, 8, 12, 13].indexOf(action.id) !== -1 && isNullOrEmpty(args.payload)) {
            validations.push({ action: action.url, message: 'A form-data payload in json format must be supplied' });
        }

        return validations;
    },
    processCommand = function (args) {
        // Process the command
        var action = null,
            validations;
        if (args.action && isAction(args.action)) {
            action = getAction(args.action);
            action.murl = action.url
                .replace(/:app_id/, args.app_id)
                .replace(/:key_id/, args.key_id)
                .replace(/:collaborator_id/, args.collaborator_id)
                .replace(/:platform/, args.platform);
            // Validate the action
            validations = validate(action, args);
            if (isNullOrEmpty(validations)) {
                // Perform the action
                execute(action, args);
            } else {
                printValidations(validations);
            }
        } else {
            // no action
            handleError('Error! No action was supplied.', null, true);
        }
    };

// Command line argument handling
program
    .arguments('<payload>')
    .version('1.0.0')
    .option('-a, --action <action>', 'The Phonegap Build action to perform')
    .option('-c, --collaborator_id <collaborator_id>', 'The Phonegap Build Collaborator id')
    .option('-d, --platform <platform>', 'The Phonegap Build platform')
    .option('-i, --app_id <app_id>', 'The Phonegap Build Application id')
    .option('-k, --key_id <key_id>', 'The Phonegap Build Signing key id')
    .option('-l, --list', 'List the available actions')
    .option('-p, --password <password>', 'The User\'s password')
    .option('-u, --username <username>', 'The User to authenticate as')
    .action(function (payload) {
        // only get here if there is a payload
        program.payload = payload;
    })
    .parse(process.argv);

// Prompt for username/password if not passed in
co(function *() {
    if (program.list) {
        // special case, only asking for list of actions
        printActions();
        process.exit(0);
    } else {
        program.username = program.username || (yield prompt('username: '));
        program.password = program.password || (yield prompt.password('password: '));
        return program;
    }
}).then(function (value) {
    // Process the command
    processCommand(value);
}, function (error) {
    handleError('Error! Could not process command line arguments.  ', error, true);
});