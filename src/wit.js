'use strict';

const Wit = require('node-wit').Wit;

const token = (() => {
    if (process.argv.length !== 3) {
        console.log('usage: node examples/weather.js <wit-token>');
        process.exit(1);
    }
    return process.argv[2];
})();

const firstEntityValue = (entities, entity) => {
    const val = entities && entities[entity] &&
        Array.isArray(entities[entity]) &&
        entities[entity].length > 0 &&
        entities[entity][0].value;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

const actions = {
    say(sessionId, context, message, cb) {
        console.log(message);
        cb();
    },
    merge(sessionId, context, entities, message, cb) {
        console.log('merge context', context);
        console.log('merge entities', entities);
        let nextContext = {};

        const intent = firstEntityValue(entities, 'intent');
        if (intent === 'restart') {
            nextContext.restartDialog = true;
            console.log('next context', nextContext);
            return cb(nextContext);
        }

        if (intent === 'greeting') {
            nextContext.greetingDialog = true;
            console.log('next context', nextContext);
        }

        const insult = entities.insult;
        if (insult) {
            nextContext.insultDialog = true;
            console.log('next context', nextContext);
            return cb(nextContext);
        }

        const faq = firstEntityValue(entities, 'faqSubject');
        if (faq) {
            nextContext.faqSubject = faq;
        }

        // copy destination and origin to the next context
        if (context.origin) {
            nextContext.origin = context.origin;
        }
        if (context.destination) {
            nextContext.destination = context.destination;
        }

        // if destination or origin were passed as entities, add them to next context
        const destination = firstEntityValue(entities, 'destination');
        console.log('destination', destination);
        if (destination) {
            nextContext.destination = destination;
            console.log('next context D', nextContext);
        }
        const origin = firstEntityValue(entities, 'origin');
        console.log('origin', origin);
        if (origin) {
            nextContext.origin = origin;
            console.log('next context O', nextContext);
        }


        if (intent === 'command') {
            switch (message) {
            case '/version':
                nextContext.botName = 'Calamarcopolo';
                nextContext.version = '0.1.11';
                break;
            default:
                break;
            }
        }
        if (intent === 'tripInfo') {
            nextContext.tripDialog = true;
        }
        console.log('next context', nextContext);
        return cb(nextContext);
    },
    error(sessionId, context, error) {
        console.log(error.message);
    }
};

const client = new Wit(token, actions);
client.interactive();
