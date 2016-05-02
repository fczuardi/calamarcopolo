'use strict';

const version = require('../../package.json').version;

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

const setupActions = callbacks => ({
    say(sessionId, context, message, cb) {
        callbacks.say(sessionId, context, message, cb);
    },
    error(sessionId, context, error) {
        callbacks.error(sessionId, context, error);
    },
    merge(sessionId, context, entities, message, cb) {
        console.log('merge context', context);
        console.log('merge entities', entities);
        let nextContext = {};

        const command = firstEntityValue(entities, 'command');

        if (command === '/start') {
            nextContext.disclaimerDialog = true;
            return callbacks.merge(sessionId, nextContext, cb);
        }

        const intent = firstEntityValue(entities, 'intent');
        if (intent === 'restart') {
            nextContext.restartDialog = true;
            console.log('next context', nextContext);
            return callbacks.merge(sessionId, nextContext, cb);
        }

        if (intent === 'greeting' || command === '/start') {
            nextContext.greetingDialog = true;
            console.log('next context', nextContext);
        }

        const insult = entities.insult;
        if (insult) {
            nextContext.insultDialog = true;
            console.log('next context', nextContext);
            return callbacks.merge(sessionId, nextContext, cb);
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
                nextContext.version = version;
                break;
            default:
                break;
            }
        }
        if (intent === 'tripInfo') {
            nextContext.tripDialog = true;
        }
        console.log('next context', nextContext);
        return callbacks.merge(sessionId, nextContext, cb);
    }
});
module.exports = setupActions;
