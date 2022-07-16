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

client.on("message", async (msg) => {
	if (msg.author.bot || !formatter.isLoaded) {
		return;
	}

	let regex = /\[\[([^\[\]]*)\]\]/g;
	for (
		let matches = regex.exec(msg.content);
		!!matches;
		matches = regex.exec(msg.content)
	) {
		let [_, query] = matches;
		let card = await cards.find(query);
		if (!card) {
			return;
		}

		let embed = formatter.format(card);
		msg.channel.send(embed);
	}
});

cards.load().then(async () => {

	const token = await loadToken();
	client.login(token);
	console.log(cards.find("afontonov"));
}).catch(console.error);

if (process.env.PORT) {
	let echo = http.createServer((req, res) => {
		req.pipe(res);
	});
	echo.listen(process.env.PORT);
}