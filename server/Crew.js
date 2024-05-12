export default class Crew {
	static id = 0;

	constructor(user) {
		this.id = Crew.id++;
		this.captain = user;
		this.mates = [user];

		this.name = `Załoga ${user.name}`;
		this.mode = "classic";
		this.slotsMax = 1;
	}

	count() {
		return this.mates.length;
	}

	// Serialized crews sent to clients to see the state locally
	serialize() {
		return {
			id: this.id,
			mates: this.mates.map(mate => ({
				avatar: mate.avatar,
				name: mate.name
			})),
			name: this.name,
			mode: this.mode,
			slotsMax: this.slotsMax
		}
	}
}