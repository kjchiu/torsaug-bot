import { Client } from "discord.js";
import fetch from "node-fetch";
import cards from "./cards.js";
import CardFormatter from "./formatter.js";
import http from "http";

const loadToken = () => {
	try {
		return require("./secret.js");
	} catch (ex) {
		return process.env.TOKEN;
	}
};

const token = loadToken();
const client = new Client();
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
		let card = cards.find(query);
		if (!card) {
			return;
		}

		let embed = formatter.format(card);
		msg.channel.send(embed);
	}
});

cards.load().then(() => client.login(token));

if (process.env.PORT) {
	let echo = http.createServer((req, res) => {
		req.pipe(res);
	});
	echo.listen(process.env.PORT);
}
