'use strict';

const version = require('../../package.json').version;
const faqAnswers = require('../../answers.json');

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
        console.log(`\nUser: ${message}\n`);
        console.log('merge context', context);
        console.log('merge entities', entities);
        let nextContext = {};

        const command = firstEntityValue(entities, 'command');
        if (command) {
            switch (command) {
            case 'restart':
                nextContext.restartDialog = true;
                console.log('next context', nextContext);
                return callbacks.merge(sessionId, nextContext, cb);
            case 'start':
                nextContext.disclaimerDialog = true;
                return callbacks.merge(sessionId, nextContext, cb);
            case 'version':
                nextContext.botName = 'Calamarcopolo';
                nextContext.version = version;
                break;
            case 'help':
                nextContext.helpDialog = true;
                console.log('next context', nextContext);
                break;
            default:
                break;
            }
        }

        const faq = firstEntityValue(entities, 'faq');
        if (faq) {
            nextContext.faqSubject = faq;
            const selectedAnswer = faqAnswers.find( answer => answer.value === faq);
            const replyText = selectedAnswer ? selectedAnswer.response : null;
            return callbacks.merge(sessionId, nextContext, cb, replyText);
        }


        const insult = entities.insult;
        if (insult) {
            nextContext.insultDialog = true;
            console.log('next context', nextContext);
            return callbacks.merge(sessionId, nextContext, cb);
        }


        // copy destination and origin to the next context
        if (context.origin) {
            nextContext.origin = context.origin;
        }
        if (context.destination) {
            nextContext.destination = context.destination;
        }

        const trip = firstEntityValue(entities, 'trip');
        if (trip === 'info') {
            nextContext.tripDialog = true;
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
        }
        const places = firstEntityValue(entities, 'places');
        if (places) {
            if (
                (nextContext.destination && !nextContext.origin) ||
                (!nextContext.destination && !nextContext.origin)
            ) {
                nextContext.origin = places;
                console.log('next context PO', nextContext);
            } else if (!nextContext.destination && nextContext.origin) {
                nextContext.destination = places;
                console.log('next context PD', nextContext);
            }
        }

        const interaction = firstEntityValue(entities, 'interaction');
        switch (interaction) {
        case 'greeting':
            nextContext.greetingDialog = true;
            break;
        case 'close':
            nextContext.closeDialog = true;
            break;
        default:
            break;
        }

        console.log('next context', nextContext);
        return callbacks.merge(sessionId, nextContext, cb);
    }
});
module.exports = setupActions;
