import fetch from "node-fetch";
import Fuse from "fuse.js";
import data from "./data.js";

class CardDatabase {

    constructor() {
        this._cards = {};
    }

    async load() {
        //this._cards = await fetch("https://netrunnerdb.com/api/2.0/public/cards");
        this._cards = data.data;
        let options = {
            keys: ["title"],
            includeScore: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
        };
        this._fuse = new Fuse(this._cards, options);
        return;
    }

    find(name) {
        let matches = this._fuse.search(name);
        if (! matches.length) {
            return null;
        }
        let score = matches[0].score;
        matches = matches.filter(match => match.score === score).sort((a, b) => a.item.title.length - b.item.title.length);
        return matches[0].item;
    }

}

export default new CardDatabase();