import { Client } from 'discord.js';
import secret from './secret.js';
import fetch from 'node-fetch'
import cards from "./cards.js";
import CardFormatter from "./formatter.js";

const client = new Client();
const formatter = new CardFormatter();
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    formatter.loadIcons(client);
});

client.on('message', async msg => {
    if (msg.author.bot || ! formatter.isLoaded) { return; }

    let regex = /\[\[([^\[\]]*)\]\]/g
    for(let matches = regex.exec(msg.content); !!matches; matches = regex.exec(msg.content)) {
        let [_, query] = matches;
        let card = cards.find(query);
        if (!card) {
            return;
        }

        let embed = formatter.format(card);
        msg.channel.send(embed);
    }

});

cards.load().then(() => client.login(secret));
