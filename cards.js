import fetch from "node-fetch";
import Fuse from "fuse.js";

const STANDARD = new Set([
	'ashes',
	'system-gateway',
	'borealis',
	"liberation",
	"elevation",
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

	normalizeTitle(title) {
		const deomposed = [...title.normalize("NFD")];
		const stripped =[...deomposed].filter(c => /[ -~]/.test(c)).join("")
		return stripped;
	}

	load() {
		console.log("#load()");
		if (this._updating) {
			console.log("already updating");
			return this._updating;
		}
		console.log("loading cards");
		this._updating = Promise.all([
			this._fetch("cards"),
			this._fetch("cycles"),
			this._fetch("packs"),
			this._fetch("mwl"),
		]).then(([cards, cycles, packs, mwl]) => {
			this._cycles = asLUT(cycles.data, "code");
			this._packs = asLUT(packs.data, "code");
			this._cards = cards.data;
			this._cards.forEach(card => {
				card.title_normalized = this.normalizeTitle(card.title);
			})
			this._lastUpdated = Date.now();
			this._mwl = mwl.data.sort((a, b) => {
				return new Date(b.date_start).valueOf() - new Date(a.date_start).valueOf();
			}).shift();

			
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
			this._indexCards();
			delete this._updating
			return cards.imageUrlTemplate;
		});
		return this._updating;
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
			keys: ["title", "title_normalized"],
			includeScore: true,
			threshold: 0.6,
			location: 0,
			distance: 100,
			maxPatternLength: 32,
		};
		this._fuse = new Fuse(this._cards, options);

	}

	getLegality(card) {
		const cycle = this.getCycle(card);
		if (STANDARD.has(cycle.code)) {
			const mwl = this._mwl.cards && this._mwl.cards[card.code] || {};
			return mwl.deck_limit === 0 && "banned";
		} else {
			return "rotated";
		}
	}

	shouldUpdate() {
		const delta = (Date.now() - this._lastUpdated) / 1000;
		console.log(`card index age: ${delta}`)
		return delta >= 60 * 60 * 24;
	}

	async find(name) {
		if (this.shouldUpdate()) {
			await this.load();
		}

		let matches = this._fuse.search(name);
		if (!matches.length) {
			return null;
		}
		let score = matches[0].score;
		matches = matches
			.filter((match) => match.score === score)
			.sort((a, b) => a.item.title.length - b.item.title.length);

		let card = matches[0].item;
		console.log(`${name} -> ${card.title_normalized}`);
		card = this.getStandardOrOldestCard(card.title);
		const pack = this._packs[card.pack_code].name;
		const cycle = this.getCycle(card);
		const legality = this.getLegality(card);
		
		return {
			...card,
			pack,
			cycle: cycle.name,
			legality,
		};
	}

}

export default new CardDatabase();
