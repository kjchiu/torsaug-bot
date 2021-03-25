import fetch from "node-fetch";
import Fuse from "fuse.js";

const STANDARD = new Set([
	"order-and-chaos",
	"data-and-destiny",
	"mumbad",
	"flashpoint",
	"red-sand",
	"kitara",
	"reign-and-reverie",
	"magnum-opus",
	'ashes',
	'nagum-opus-reprint',
	'system-gateway',
	'system-update-2021',
]);

const asLUT = (arr, prop) => {
	return arr.reduce((accum, element) => {
		accum[element[prop]] = element;
		return accum;
	}, {});
}

class CardDatabase {
	constructor() {
		this._cardsByCode = {};
		this._cardsByName = {};
	}

	_fetch(endpoint) {
		return fetch(`https://netrunnerdb.com/api/2.0/public/${endpoint}`)
			.then(res =>
				res.json());
	}

	load() {
		return Promise.all([
			this._fetch("cards"),
			this._fetch("cycles"),
			this._fetch("packs"),
		]).then(([cards, cycles, packs]) => {
			this._cycles = asLUT(cycles.data, "code");
			this._packs = asLUT(packs.data, "code");
			this._cards = cards.data;

			
			this._sortedCodesByName = Object.values(this._cards).reduce((accum, card) => {
				const cycle = this.getCycle(card);
				const { title } = card;
				if (! accum[title]) {
					accum[title] = [card]
				} else {
					let versions = accum[title];
					const idxInsert = versions.findIndex(other => {
						const otherCycle = this.getCycle(other);
						return otherCycle.position < cycle.position;
					});
					if (idxInsert > -1) {
						versions.splice(idxInsert, 0, card);
					} else {
						versions.push(card);
					}
				}
				return accum;
			})
			this._indexCards(cards.data);
		});
	}

	getCycle(card={}) {
		const pack = this._packs[card.pack_code];
		return this._cycles[pack.cycle_code];
	}

	getStandardOrOldestCard(title) {
		const versions = this._sortedCodesByName[title] || [];
		const latest = versions.find(card => {
			const cycle = this.getCycle(card);
			if (! cycle) {
				return false;
			}
			return STANDARD.has(cycle.code);
		});
		if (latest) {
			return latest;
		}

		return versions.length
			? versions[versions.length - 1]
			: undefined;
	}

	_indexCards() {
		let options = {
			keys: ["title"],
			includeScore: true,
			threshold: 0.6,
			location: 0,
			distance: 100,
			maxPatternLength: 32,
		};
		this._fuse = new Fuse(this._cards, options);

	}

	find(name) {
		let matches = this._fuse.search(name);
		if (!matches.length) {
			return null;
		}
		let score = matches[0].score;
		matches = matches
			.filter((match) => match.score === score)
			.sort((a, b) => a.item.title.length - b.item.title.length);

		let card = matches[0].item;
		card = this.getStandardOrOldestCard(card.title);
		const pack = this._packs[card.pack_code].name;
		const cycle = this.getCycle(card);
		const legality = STANDARD.has(cycle.code);
		return {
			...card,
			pack,
			cycle: cycle.name,
			legality,
		};
	}

}

export default new CardDatabase();
