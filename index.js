import { Client, MessageEmbed } from 'discord.js';
import secret from './secret.js';
import fetch from 'node-fetch'
import cards from "./cards.js";

let FACTION_COLOURS = {
    "anarch": "#ff4500",
    "criminal": "#4169e1",
    "shaper": "#32cd32",
    "adam": "#9a8f45",
    "sunny": "#907193",
    "apex": "#671412",
    "neutral-runner": "#808080",
    "jinteki": "#ed143d",
    "weyland-consortium": "#006400",
    "haas-bioroid": "#8a2be2",
    "nbn": "#ff8c00",
    "neutral-corp": "#808080"
};

const client = new Client();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
    if (msg.author.bot) { return;}

    let [_, query] = /\[\[(.*)\]\]/.exec(msg.content) || [];
    if (! query) { return; }
    let card = cards.find(query);
    if (! card) {
        return;
    }

    let embed = new MessageEmbed()
        .setColor(FACTION_COLOURS[card.faction_code] || "#808080")
        .setTitle(card.title)
        .setThumbnail(`https://netrunnerdb.com/card_image/large/${card.code}.jpg`)
        .setURL(`https://netrunnerdb.com/en/card/${card.code}`)
        .setDescription(card.text);


    msg.channel.send(embed);
});

cards.load().then(() => client.login(secret));
