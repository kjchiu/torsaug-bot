import { Client, Intents } from "discord.js";
import fetch from "node-fetch";
import cards from "./cards.js";
import CardFormatter from "./formatter.js";
import http from "http";

const loadToken = async () => {
	try {
		const secret = await import("./secret.js");
		return secret.default;
	} catch (ex) {
		return Promise.resolve(process.env.TOKEN);
	}
};


const client = new Client({ intents: new Intents([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES])});
const formatter = new CardFormatter();

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
	formatter.loadIcons(client);
});

async function parse(msg, regex, format) {
	for (
		let matches = regex.exec(msg.content);
		!!matches;
		matches = regex.exec(msg.content)
	) {
		let [idx, query] = matches;
		let card = await cards.find(query);
		if (!card) {
			return;
		}

		const isArtOnly = msg.content[idx - 1] === "{";
		let response = format(card)
		console.log(isArtOnly, response)
		msg.channel.send(response);
	}
}

client.on("message", async (msg) => {
	if (msg.author.bot || !formatter.isLoaded) {
		return;
	}
	const cardRegex = /\[\[([^\[\]]*)\]\]/g;
	const artRegex = /\{\{([^\{\}]*)\}\}/g;

	await parse(msg, cardRegex, (card) => formatter.format(card))
	await parse(msg, artRegex, (card) => formatter.formatArt(card))

});

cards.load().then(async (imageUrlTemplate) => {
	const token = await loadToken();
	const authed = await client.login(token);
	console.log((await cards.find("afontonov"))?.code);
	if (imageUrlTemplate) {
		formatter.imageUrlTemplate = imageUrlTemplate;
	}
}).catch(console.error);

if (process.env.PORT) {
	let echo = http.createServer((req, res) => {
		req.pipe(res);
	});
	echo.listen(process.env.PORT);
}
