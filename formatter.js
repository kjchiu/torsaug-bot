import { MessageEmbed, Util } from "discord.js";

const FACTION_COLOURS = {
	anarch: "#ff4500",
	criminal: "#4169e1",
	shaper: "#32cd32",
	adam: "#9a8f45",
	sunny: "#907193",
	apex: "#671412",
	"neutral-runner": "#808080",
	jinteki: "#ed143d",
	"weyland-consortium": "#006400",
	"haas-bioroid": "#8a2be2",
	nbn: "#ff8c00",
	"neutral-corp": "#808080",
};
const INFLUENCE_PIPS = "●●●●●";
const ICONS = [
	"trash",
	"credit",
	"interrupt",
	"agendapoint",
	"mu",
	"advancement",
	"subroutine",
];

export default class CardFormatter {

	emojiIdByIcon;
	imageUrlTemplate;
	
	constructor() {
		this.imageUrlTemplate = "https://static.nrdbassets.com/v1/large/{code}.jpg";
	}

	get isLoaded() {
		return !!this.emojiIdByIcon;
	}

	icon(name) {
		return this.emojiIdByIcon[name];
	}

	loadIcons(client) {
		this.emojiIdByIcon = ICONS.reduce((accum, icon) => {
			let emoji = client.emojis.cache.find((emoji) => emoji.name === icon);
			if (!emoji) {
				console.error(`unknown emoji ${icon}`);
				return accum;
			}
			accum[icon] = `<:${emoji.name}:${emoji.id}>`;
			return accum;
		}, {});
	}

	stripTags(text = "") {
		return text.replace(/\<\/?\w+\>/g, "");
	}

	formatTypeInfo(card) {
		switch (card.type_code) {
			case "agenda":
				return `${card.advancement_cost} ${this.icon("advancement")} - ${
					card.agenda_points
				} ${this.icon("agendapoint")}`;
			case "ice":
				return `${card.cost} ${this.icon("credit")} - ${card.strength}`;
			case "program":
				return card.hasOwnProperty("strength")
					? `${card.cost} ${this.icon("credit")} - ${
							card.memory_cost
					  } ${this.icon("mu")} - ${card.strength}`
					: `${card.cost} ${this.icon("credit")} - ${
							card.memory_cost
					  } ${this.icon("mu")}`;
			case "identity":
				return `${card.minimum_deck_size}/${card.influence_limit}`;
			default:
				return card.hasOwnProperty("trash_cost")
					? `${card.cost} ${this.icon("credit")} - ${
							card.trash_cost
					  } ${this.icon("trash")}`
					: `${card.cost} ${this.icon("credit")}`;
		}
	}

	replaceIcons(text) {
		return text.replace(/\[(\w+)\]/g, (match, icon) => {
			let emoji = this.icon(icon);
			return emoji || match;
		});
	}

	format(card) {
		const type = card.type_code[0].toUpperCase() + card.type_code.substring(1);

		let lines = [
			[
				type,
				card.keywords,
				this.formatTypeInfo(card),
				INFLUENCE_PIPS.substring(0, card.faction_cost),
			]
				.filter(Boolean)
				.join(" - "),
			this.stripTags(this.replaceIcons(card.text)),
		];

		let embed = new MessageEmbed()
			.setColor(FACTION_COLOURS[card.faction_code] || "#808080")
			.setTitle((card.uniqueness ? "♦ " : "") + card.title)
			.setThumbnail(this.imageUrlTemplate.replace(/\{code\}/, card.code))
			.setURL(`https://netrunnerdb.com/en/card/${card.code}`)
			.setDescription(lines);
		const isBigbox = card.cycle === card.pack;
		let legality;
		if (card.legality === "banned") {
			legality = "🚫";
		} else if (card.legality === "rotated") {
			legality = "🥔";
		} else {
			legality = "✅";
		}
		const path = isBigbox
			? `${card.cycle}`
			: `${card.cycle} / ${card.pack}`
		let footer = [`Illus. ${card.illustrator}  / ${path} / #${card.position} ${legality}`]
		card.flavor && footer.unshift(card.flavor);
		embed.setFooter(footer);
		return embed;
	}


	formatArt(card) {
		const template = card.imageUrlTemplate ?? this.imageUrlTemplate;
		console.log(template);
		return template.replace(/\{code\}/, card.code);
	}
}
