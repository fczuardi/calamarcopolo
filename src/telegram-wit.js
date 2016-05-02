const Telegram = require('telegram-bot-api');
const Wit = require('node-wit').Wit;
const setupActions = require('./lib/witActions');
const inspect = require('util').inspect;

const errorText = context => `Vixe, me confundi aqui. Perdão. ${JSON.stringify(context)}`;
const doneText = 'ok';
const doneState = context => `[done] ${JSON.stringify(context)}`;
const tgToken = process.env.TELEGRAM_TOKEN;
const witToken = process.env.WIT_SERVER_ACCESS_TOKEN;

console.log('tokens:', tgToken, witToken);

const tgOptions = {
    token: tgToken,
    updates: { enabled: true }
};
const tgClient = new Telegram(tgOptions);
var sessions = {};

tgClient.getMe()
    .then(data => console.log(`Get me: ${inspect(data)}`))
    .catch(err => console.log(err))
;
tgClient.on('message', message => {
    const chatId = message.chat.id;
    const text = message.text;
    if (!sessions[chatId]) {
        const actions = setupActions({
            say: (sessionId, context, msg, cb) => {
                console.log(`Say: ${msg}`);
                if (!sessions[sessionId]) {
                    sessions[sessionId] = { context: {} };
                }
                console.log('update local context (say)', sessions[sessionId].context);
                sessions[sessionId].context = context;
                sessions[sessionId].userWaiting = false;
                tgClient.sendMessage({
                    chat_id: chatId,
                    text: msg
                })
                // .then(tgMsg => console.log(`"Say" message sent to TG: ${tgMsg}`))
                .catch(err => console.log(`Telegram sendMessage catch: ${err}`));
                return cb();
            },
            error: (sessionId, context, error) => {
                console.log(`Error: ${inspect(error)}, ${sessionId}, ${inspect(context)}`);
                if (!sessions[sessionId]) {
                    sessions[sessionId] = { context: {} };
                }
                console.log('update local context (error)', sessions[sessionId].context);
                sessions[sessionId].context = context;
                sessions[sessionId].userWaiting = false;
                tgClient.sendMessage({
                    chat_id: chatId,
                    text: errorText(context)
                })
                // .then(msg => console.log(`Error message sent to TG: ${msg}`))
                .catch(err => console.log(`Telegram sendMessage catch: ${err}`));
            },
            merge: (sessionId, context, cb) => {
                if (!sessions[sessionId]) {
                    sessions[sessionId] = { context: {} };
                }
                sessions[sessionId].context = context;
                sessions[sessionId].userWaiting = true;
                return cb(context);
            }
        });
        sessions[chatId] = {
            context: {},
            userWaiting: true,
            wit: new Wit(witToken, actions)
        };
    }
    const localSession = sessions[chatId];
    localSession.wit.runActions(chatId, text, localSession.context, (error, context) => {
        if (error) {
            return console.log(`Oops! Got an error: ${error}`);
        }

        console.log('Waiting for futher messages.', inspect(context), Object.keys(context).length);
        if (!Object.keys(context).length) {
            tgClient.sendMessage({
                chat_id: chatId,
                text: doneText
            });
            return context;
        }

        if (sessions[chatId] && sessions[chatId].userWaiting) {
            tgClient.sendMessage({
                chat_id: chatId,
                text: doneState(context)
            });
        }
        return context;

        // Based on the session state, you might want to reset the session.
        // This depends heavily on the business logic of your bot.
        // Example:
        // if (context['done']) {
        //   delete sessions[sessionId];
        // }
    });
});

// tgClient.on('inline.query', message =>
//     console.log(`inline.query: ${inspect(message)}`));
// tgClient.on('inline.result', message =>
//     console.log(`inline.result: ${inspect(message)}`));
// tgClient.on('inline.callback.query', message =>
//     console.log(`inline.callback.query: ${inspect(message)}`));
// tgClient.on('update', update =>
//     console.log(`update message text: ${inspect(update.message.text)}`));
