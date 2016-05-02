'use strict';

const Wit = require('node-wit').Wit;
const actions = require('./lib/witActions');

const token = (() => {
    if (process.argv.length !== 3) {
        console.log('usage: node examples/weather.js <wit-token>');
        process.exit(1);
    }
    return process.argv[2];
})();

const client = new Wit(token, actions);
client.interactive();
