export default class Crew {
	static id = 0;

	constructor(user) {
		this.id = Crew.id++;
		this.mates = [user];

		this.name = `Załoga ${user.name}`;
		this.mode = "classic";
		this.slotsMax = 1;
	}

	count() {
		return this.mates.length;
	}
}