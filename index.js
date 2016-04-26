#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" $NODE_HARMONY_FLAGS "$0" "$@"

const restify = require('restify');
const builder = require('botbuilder');
const tsmlj = require('tsmlj');
const rp = require('request-promise');

const {
    LUIS_MARCOPOLO_URL,
    LUIS_ROBOVIARIO_URL,
    LUIS_CORTANA_URL,
    LUIS_HELLO_GOODBYE,
    BOT_FRAMEWORK_ENDPOINT_PATH
} = process.env;
const bot = new builder.BotConnectorBot();
const server = restify.createServer();
const mainDialog = new builder.LuisDialog(LUIS_MARCOPOLO_URL);

mainDialog.onDefault((session, args) => {
    const urls = [
        `${LUIS_CORTANA_URL}&q=${encodeURIComponent(session.message.text)}`,
        `${LUIS_ROBOVIARIO_URL}&q=${encodeURIComponent(session.message.text)}`,
        `${LUIS_HELLO_GOODBYE}&q=${encodeURIComponent(session.message.text)}`
    ];
    Promise.all([rp(urls[0]), rp(urls[1])]).then((values) => {
        console.log('values', values);
        const cortanaResult = JSON.parse(values[0]);
        const roboviarioResult = JSON.parse(values[1]);
        const helloGoodbyeResult = JSON.parse(values[2]);
        const message = tsmlj`
            *calamarcopolo:*
                ${args.intents[0].intent},
                ${args.intents[0].score};
            *roboviário:*
                ${roboviarioResult.intents[0].intent},
                ${roboviarioResult.intents[0].score};.
            *helloGoodbye:*
                ${helloGoodbyeResult.intents[0].intent},
                ${helloGoodbyeResult.intents[0].score};.
            *cortana:*
                ${cortanaResult.intents[0].intent},
                ${cortanaResult.intents[0].score};
        `;
        console.log('message ', message);
        session.send(message);
    });
});

bot.add('/', mainDialog);

server.use(bot.verifyBotFramework({
    appID: process.env.BOT_FRAMEWORK_APP_ID,
    appSecret: process.env.BOT_FRAMEWORK_APP_SECRET
}));
server.post(BOT_FRAMEWORK_ENDPOINT_PATH || '/api/messages', bot.listen());
server.listen(process.env.PORT || 8080, () => {
    console.log('%s listening to %s', server.name, server.url);
});
