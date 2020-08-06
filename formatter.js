import { MessageEmbed, Util } from "discord.js";

const FACTION_COLOURS = {
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
const INFLUENCE_PIPS = "●●●●●";
const ICONS = [
    "trash",
    "credit",
    "interrupt",
    "agendapoint",
    "mu",
    "advancement",
    "strength",
];

export default class CardFormatter {

    emojiIdByIcon;

    get isLoaded() {
        return !! this.emojiIdByIcon;
    }

    icon(name) {
        return this.emojiIdByIcon[name];
    }

    loadIcons(client) {
        this.emojiIdByIcon = ICONS.reduce((accum, icon) => {
            let emoji = client.emojis.cache.find(emoji => emoji.name === icon);
            accum[icon] = `<:${emoji.name}:${emoji.id}>`
            return accum;
        }, {});
    }

    stripTags(text="") {
        return text.replace(/\<\/?\w+\>/g, "");
    }

    formatTypeInfo(card) {
        switch (card.type_code) {
            case "agenda":
                return `${card.advancement_cost} ${this.icon("advancement")} - ${card.agenda_points} ${this.icon("agendapoint")}`
            case "ice":
                return `${card.cost} ${this.icon("credit")} - ${card.strength} ${this.icon("strength")}`
            case "program":
                return card.hasOwnProperty("strength")
                    ? `${card.cost} ${this.icon("credit")} - ${card.memory_cost} ${this.icon("mu")} - ${card.strength} - ${this.icon("strength")}`
                    : `${card.cost} ${this.icon("credit")} - ${card.memory_cost} ${this.icon("mu")}`;
            default:
                return card.hasOwnProperty("trash_cost")
                    ? `${card.cost} ${this.icon("credit")} - ${card.trash_cost} ${this.icon("trash")}`
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
            [type, card.keywords, this.formatTypeInfo(card), INFLUENCE_PIPS.substring(0, card.faction_cost)].filter(Boolean).join(" - "),
            this.stripTags(this.replaceIcons(card.text)),
        ];

        let embed = new MessageEmbed()
            .setColor(FACTION_COLOURS[card.faction_code] || "#808080")
            .setTitle((card.uniqueness ? "♦ " : "") + card.title)
            .setThumbnail(`https://netrunnerdb.com/card_image/large/${card.code}.jpg`)
            .setURL(`https://netrunnerdb.com/en/card/${card.code}`)
            .setDescription(lines);
        if (card.flavor) {
            embed.setFooter([
                card.flavor
            ]);
        }
        return embed;
    }
}