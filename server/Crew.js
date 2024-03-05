export default class Crew {
	static id = 0;

	constructor(player) {
		this.id = Crew.id++;
		this.players = [player];

		this.name = `Załoga ${player.name}`;
		this.mode = "classic";
		this.slotsMax = 1;
	}

	count() {
		return this.players.length;
	}
}